import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { marca } from './src/config/marca.ts';

// Pasta do app no endereço: GitHub Pages publica em https://guilhermembossi.github.io/app-platinas/.
const BASE = process.env.BASE ?? '/app-platinas/';

const variaveis = Object.entries(marca.cores).map(([k, v]) => `--${k}:${v}`).join(';');

const manifest = () => JSON.stringify({
  name: marca.nome,
  short_name: marca.nomeCurto,
  description: marca.descricao,
  lang: marca.idioma,
  start_url: BASE,
  scope: BASE,
  display: 'standalone',
  orientation: 'portrait',
  background_color: marca.cores.fundo,
  theme_color: marca.cores.superficie,
  icons: [
    { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2);

// Põe a marca no index.html (título e cores do tema) e gera o manifest.
function marcaNoApp(): Plugin {
  return {
    name: 'marca-no-app',
    transformIndexHtml(html) {
      return html
        .replaceAll('%NOME%', marca.nome)
        .replaceAll('%DESCRICAO%', marca.descricao)
        .replaceAll('%IDIOMA%', marca.idioma)
        .replaceAll('%COR_TOPO%', marca.cores.superficie)
        .replace('</head>', `<style>:root{${variaveis};color-scheme:dark}</style></head>`);
    },
    configureServer(server) {
      server.middlewares.use(`${BASE}manifest.webmanifest`, (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(manifest());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() });
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), marcaNoApp()],
});
