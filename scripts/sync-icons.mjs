/**
 * Copia os ícones exportados do Figma para src/assets/icons, trocando as cores fixas
 * por currentColor para que a cor venha do CSS. Ícones de marca (Google) mantêm as cores.
 *
 * Uso: node scripts/sync-icons.mjs <pasta-com-svgs-do-figma>
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const MAP = {
  search: 'search-icon',
  cart: 'cart-icon',
  logout: 'iconly-curved-logout',
  'chevron-down': 'iconly-two-tone-arrow-down-2',
  'arrow-right': 'iconly-curved-arrow-right',
  'arrow-right-2': 'iconly-curved-arrow-right-2',
  'arrow-left-2': 'iconly-curved-arrow-left-2',
  heart: 'heart-1',
  'heart-filled': 'heart',
  star: 'iconly-bold-star',
  trash: 'iconly-curved-delete',
  'eye-off': 'iconly-curved-hide',
  filter: 'iconly-curved-filter',
  home: 'iconly-bold-home',
  user: 'user',
  shop: 'shop',
  bag: 'shopping-1',
  facebook: 'facebook',
  instagram: 'instagram',
  twitter: 'twitter',
  linkedin: 'linkedin',
  youtube: 'union',
  share: 'message',
  close: 'x',
  activity: 'iconly-curved-activity',
  download: 'iconly-curved-download',
  'danger-triangle': 'iconly-curved-danger-triangle',
  location: 'iconly-light-outline-location',
  image: 'iconly-curved-image-2',
  'thank-you': 'thank-you-1',
  dots: 'group-4',
  wallet: 'iconly-curved-wallet',
  google: 'google-1',
};
const KEEP_COLORS = new Set(['google', 'thank-you']);

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Informe a pasta com os SVGs exportados.');
  process.exit(1);
}
const outDir = path.resolve('src/assets/icons');
await mkdir(outDir, { recursive: true });

for (const [name, source] of Object.entries(MAP)) {
  let svg;
  try {
    svg = await readFile(path.join(sourceDir, `${source}.svg`), 'utf8');
  } catch {
    console.warn(`ausente: ${source}`);
    continue;
  }
  if (!KEEP_COLORS.has(name)) {
    svg = svg.replace(/(fill|stroke)="#[0-9a-fA-F]{3,8}"/g, '$1="currentColor"');
  }
  // Remove width/height apenas da tag raiz; o tamanho vem do CSS. stroke-width fica intacto.
  svg = svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag
      .replace(/\s(width|height)="[\d.]+"/g, '')
      .replace('<svg ', '<svg aria-hidden="true" focusable="false" '),
  );
  await writeFile(path.join(outDir, `${name}.svg`), svg.trim() + '\n');
}
console.log('ok');
