// Gera os ícones do app a partir de src/config/marca.ts. Rodar: npm run icones
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { marca, logoSvg } from '../src/config/marca.ts';

const pasta = new URL('../public/icones/', import.meta.url);
mkdirSync(pasta, { recursive: true });
const { fundo, desenho } = marca.icone;

const icones = [
  ['icone-192.png', 192, true],
  ['icone-512.png', 512, true],
  ['icone-maskable-512.png', 512, false],
  ['apple-touch-icon.png', 180, false],
];
for (const [nome, lado, cantos] of icones) {
  await sharp(Buffer.from(logoSvg(fundo, desenho, cantos))).resize(lado, lado).png().toFile(fileURLToPath(new URL(nome, pasta)));
  console.log('ok', nome);
}
writeFileSync(new URL('icone.svg', pasta), logoSvg(fundo, desenho, true));
console.log('ok icone.svg');
