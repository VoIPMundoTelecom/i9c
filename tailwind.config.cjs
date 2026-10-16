/** Tema i9c (era o tailwind.config inline do Play CDN). */
module.exports = {
  "content": [
    "./src/**/*.{astro,html,js,ts}",
    "./public/assets/*.js"
  ],
  "theme": {
    "extend": {
      "fontFamily": {
        "display": [
          "\"Bricolage Grotesque\"",
          "system-ui",
          "sans-serif"
        ],
        "sans": [
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        "mono": [
          "\"Space Grotesk\"",
          "system-ui",
          "sans-serif"
        ]
      },
      "colors": {
        "ivm": {
          "azul": "#1E2C5C",
          "azulSoft": "#2A3B6E"
        },
        "i9c": {
          "azul": "#136BA2",
          "azulDark": "#0E5483",
          "azulSoft": "#E7F0F6"
        },
        "laranja": {
          "DEFAULT": "#E8672A",
          "dark": "#BD4C18",
          "soft": "#FCEEE3"
        },
        "cinza": {
          "50": "#FAFAFA",
          "100": "#F4F4F3",
          "200": "#E8E8E7",
          "DEFAULT": "#716F6E"
        }
      },
      "letterSpacing": {
        "tightest": "-0.03em"
      }
    }
  }
};
