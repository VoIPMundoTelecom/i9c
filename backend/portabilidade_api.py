"""
i9c — Receptor de Portabilidade (FastAPI)
=========================================
Recebe o POST multipart do formulário portabilidade.html com segurança
incorporada: validação server-side de CPF/CNPJ, allowlist de tipos de
arquivo, limite de tamanho, sanitização de nome, anti path-traversal,
checagem de origem (anti-CSRF), honeypot e logging mínimo (LGPD).

NUNCA confie na validação do front-end: tudo é revalidado aqui.

Dependências:
    pip install "fastapi>=0.110" "uvicorn[standard]" python-multipart

Execução (dev):
    uvicorn portabilidade_api:app --host 0.0.0.0 --port 8080

Produção: rode atrás de Nginx/Cloudflare com HTTPS, rate limiting no
proxy/WAF e o diretório UPLOAD_DIR FORA do webroot, sem permissão de execução.
"""

import os
import re
import json
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Configuração (via variáveis de ambiente — nunca hardcode segredos)
# ---------------------------------------------------------------------------
UPLOAD_DIR = Path(os.getenv("I9C_UPLOAD_DIR", "/var/i9c/portabilidade")).resolve()
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv(
        "I9C_ALLOWED_ORIGINS", "https://i9c.net.br,https://www.i9c.net.br"
    ).split(",") if o.strip()
]
MAX_FILE_BYTES = int(os.getenv("I9C_MAX_FILE_MB", "5")) * 1024 * 1024
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".pdf", ".csv", ".xlsx"}
ALLOWED_MIME = {
    "image/jpeg", "image/png", "application/pdf", "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",  # alguns navegadores enviam genérico
}

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("i9c.portabilidade")

app = FastAPI(title="i9c Portabilidade", docs_url=None, redoc_url=None)


# ---------------------------------------------------------------------------
# Validadores (espelham o front, mas são a fonte de verdade)
# ---------------------------------------------------------------------------
def so_digitos(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def valida_cpf(cpf: str) -> bool:
    c = so_digitos(cpf)
    if len(c) != 11 or c == c[0] * 11:
        return False
    for i in (9, 10):
        soma = sum(int(c[n]) * ((i + 1) - n) for n in range(i))
        d = (soma * 10) % 11 % 10
        if d != int(c[i]):
            return False
    return True


def valida_cnpj(cnpj: str) -> bool:
    c = so_digitos(cnpj)
    if len(c) != 14 or c == c[0] * 14:
        return False
    def dv(base: str) -> int:
        pesos = list(range(2, 10)) * 2
        soma = sum(int(d) * p for d, p in zip(reversed(base), pesos))
        r = soma % 11
        return 0 if r < 2 else 11 - r
    return dv(c[:12]) == int(c[12]) and dv(c[:13]) == int(c[13])


def valida_doc(tipo: str, doc: str) -> bool:
    return valida_cpf(doc) if tipo == "PF" else valida_cnpj(doc)


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]")


def nome_seguro(filename: str) -> str:
    """Remove path e caracteres perigosos; previne path traversal."""
    base = os.path.basename(filename or "arquivo")
    base = SAFE_NAME.sub("_", base)[:80]
    return base or "arquivo"


async def salva_upload(f: UploadFile, prefixo: str, destino: Path) -> str:
    if f is None or not f.filename:
        return ""
    ext = Path(f.filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=415, detail="Tipo de arquivo não permitido.")
    if f.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail="Tipo de conteúdo não permitido.")
    # lê em pedaços, impondo o limite de tamanho (não confia no header)
    nome = f"{prefixo}_{uuid.uuid4().hex}{ext}"
    caminho = (destino / nome)
    # garante que continua dentro do diretório (defesa extra anti-traversal)
    if not str(caminho.resolve()).startswith(str(destino.resolve())):
        raise HTTPException(status_code=400, detail="Caminho inválido.")
    total = 0
    with open(caminho, "wb") as out:
        while chunk := await f.read(1024 * 1024):
            total += len(chunk)
            if total > MAX_FILE_BYTES:
                out.close()
                caminho.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Arquivo acima do limite.")
            out.write(chunk)
    os.chmod(caminho, 0o600)  # somente o serviço lê
    return nome


def origem_permitida(request: Request) -> bool:
    origin = request.headers.get("origin") or ""
    referer = request.headers.get("referer") or ""
    if not ALLOWED_ORIGINS:
        return True
    return any(origin == o or referer.startswith(o) for o in ALLOWED_ORIGINS)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/portabilidade")
async def portabilidade(
    request: Request,
    tipo_pessoa: str = Form(...),
    nome: str = Form(...),
    documento: str = Form(...),
    email: str = Form(...),
    telefone_contato: str = Form(...),
    numero_portar: str = Form(...),
    operadora_atual: str = Form(...),
    endereco: str = Form(...),
    complemento_bairro: str = Form(...),
    cep: str = Form(...),
    cidade: str = Form(...),
    estado: str = Form(...),
    qtd_linhas: int = Form(1),
    consent: str = Form(""),
    website: str = Form(""),  # honeypot
    doc_identidade: UploadFile = File(...),
    doc_titular: UploadFile = File(...),
    arquivo_numeros: UploadFile = File(None),
):
    # 1) Anti-CSRF leve: origem/referer na allowlist
    if not origem_permitida(request):
        raise HTTPException(status_code=403, detail="Origem não autorizada.")

    # 2) Honeypot: bots preenchem; humanos não veem o campo
    if website.strip():
        log.info("honeypot acionado ip=%s", request.client.host if request.client else "?")
        return JSONResponse({"ok": True})  # responde 200 sem processar

    # 3) Consentimento LGPD obrigatório
    if consent not in ("on", "true", "1", "yes"):
        raise HTTPException(status_code=400, detail="Consentimento LGPD obrigatório.")

    # 4) Validações de negócio
    tipo = tipo_pessoa.upper().strip()
    if tipo not in ("PF", "PJ"):
        raise HTTPException(status_code=400, detail="Tipo de pessoa inválido.")
    if not valida_doc(tipo, documento):
        raise HTTPException(status_code=400, detail="CPF/CNPJ inválido.")
    if not EMAIL_RE.match(email.strip()):
        raise HTTPException(status_code=400, detail="E-mail inválido.")
    if estado.strip().upper() not in {
        "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
        "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"}:
        raise HTTPException(status_code=400, detail="UF inválida.")
    if qtd_linhas < 1 or qtd_linhas > 1000:
        raise HTTPException(status_code=400, detail="Quantidade de linhas inválida.")

    # 5) Arquivos
    protocolo = uuid.uuid4().hex[:12]
    pasta = (UPLOAD_DIR / protocolo)
    pasta.mkdir(parents=True, exist_ok=True)
    f_id = await salva_upload(doc_identidade, "identidade", pasta)
    f_conta = await salva_upload(doc_titular, "conta", pasta)
    f_num = await salva_upload(arquivo_numeros, "numeros", pasta) if arquivo_numeros else ""

    # 6) Persistência mínima (sem logar PII em texto plano nos logs do app)
    registro = {
        "protocolo": protocolo,
        "recebido_em": datetime.now(timezone.utc).isoformat(),
        "tipo_pessoa": tipo,
        "nome": nome.strip()[:120],
        "documento": so_digitos(documento),
        "email": email.strip().lower()[:120],
        "telefone_contato": so_digitos(telefone_contato),
        "numero_portar": so_digitos(numero_portar),
        "operadora_atual": operadora_atual.strip()[:40],
        "endereco": endereco.strip()[:200],
        "complemento_bairro": complemento_bairro.strip()[:120],
        "cep": so_digitos(cep),
        "cidade": cidade.strip()[:80],
        "estado": estado.strip().upper(),
        "qtd_linhas": qtd_linhas,
        "consent_lgpd": True,
        "arquivos": {"identidade": f_id, "conta": f_conta, "numeros": f_num},
        "ip": request.client.host if request.client else None,
    }
    with open(pasta / "registro.json", "w", encoding="utf-8") as fp:
        json.dump(registro, fp, ensure_ascii=False, indent=2)
    os.chmod(pasta / "registro.json", 0o600)

    # Log sem PII sensível
    log.info("portabilidade recebida protocolo=%s uf=%s linhas=%s",
             protocolo, registro["estado"], qtd_linhas)

    # TODO: notificar equipe (e-mail/Bitrix24) e/ou gravar no banco.

    return JSONResponse({"ok": True, "protocolo": protocolo})


@app.get("/healthz")
async def health():
    return {"status": "ok"}
