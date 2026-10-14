/**
 * Gera as variantes otimizadas das artes dos NFTs a partir dos originais do Figma.
 *
 * Uso: node scripts/optimize-images.mjs <pasta-com-originais>
 * Os originais ficam fora do repositório; só as saídas em public/images/nfts são versionadas.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const SOURCES = {
  'ape-emerald': '8459204731e6eba9d474cbc8ebc37071360d3ba5',
  'ape-sage': '2986a7cb16d09de8970824d2dd58bf0bb021702c',
  'ape-neon': '9df2ff42dd27ba657621c304557d1a855a4be6a5',
  'ape-golden': '87580f2def9af0ce13f4b6f6ce17bb2449bcfc16',
};

// Larguras cobrem os tamanhos do layout em 1x e 2x (70, 100, 213, 250, 404, 450).
const WIDTHS = [160, 320, 480, 640, 900];
const OUTPUT_DIR = path.resolve('public/images/nfts');

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Informe a pasta com as imagens originais.');
  process.exit(1);
}

await mkdir(OUTPUT_DIR, { recursive: true });

for (const [name, file] of Object.entries(SOURCES)) {
  const input = sharp(path.join(sourceDir, file));
  for (const width of WIDTHS) {
    const resized = input.clone().resize(width, width, { fit: 'cover' });
    await resized
      .clone()
      .webp({ quality: 78 })
      .toFile(path.join(OUTPUT_DIR, `${name}-${width}.webp`));
    await resized
      .clone()
      .avif({ quality: 55 })
      .toFile(path.join(OUTPUT_DIR, `${name}-${width}.avif`));
  }
  console.log(`ok ${name}`);
}
