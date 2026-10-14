import type {
  Quote,
  QuoteCoupon,
  QuoteIssue,
  QuoteLine,
  QuoteLineInput,
  QuoteRequest,
} from '@/contracts';
import { addEth, compareEth, eth, mulEth, roundEth, subEth } from '@/lib/money';

import { COUPONS, NETWORK_FEE } from '../db/fixtures';
import { fnv1a } from '../db/seed';
import { validationError } from '../errors';
import { consumeOnce, getScenario } from '../runtime';
import { findNft, increaseNftPrice, setEditionAvailability, toSummary } from './catalog';

export interface QuoteOptions {
  /** "checkout" dispara a interrupção configurada no cenário (preço muda / edição esgota). */
  context?: 'cart' | 'checkout';
}

function resolveCoupon(code: string | null | undefined): QuoteCoupon | null {
  const normalized = (code ?? '').trim().toUpperCase();
  if (!normalized) return null;
  const coupon = COUPONS.find((item) => item.code === normalized);
  if (!coupon)
    return { code: normalized, status: 'invalid', description: 'Código promocional inválido.' };
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) {
    return { code: normalized, status: 'expired', description: 'Este código promocional expirou.' };
  }
  return { code: normalized, status: 'applied', description: coupon.description };
}

function computeDiscount(subtotal: string, coupon: QuoteCoupon | null): string {
  if (!coupon || coupon.status !== 'applied') return '0';
  const record = COUPONS.find((item) => item.code === coupon.code);
  if (!record) return '0';
  const raw =
    record.kind === 'percent'
      ? mulEth(subtotal, eth(record.value).div(100).toString())
      : record.value;
  const capped = compareEth(raw, subtotal) > 0 ? subtotal : raw;
  return roundEth(capped, 6);
}

function validateLines(lines: QuoteLineInput[] | undefined): QuoteLineInput[] {
  if (!Array.isArray(lines)) throw validationError({ items: ['Informe os itens da cotação.'] });
  return lines.map((line) => {
    const quantity = Number(line.quantity);
    if (!line.nftId || !line.editionId || !Number.isInteger(quantity) || quantity < 1) {
      throw validationError({ items: ['Cada item precisa de NFT, edição e quantidade inteira.'] });
    }
    return { nftId: line.nftId, editionId: line.editionId, quantity };
  });
}

export function buildQuote(body: QuoteRequest, options: QuoteOptions = {}): Quote {
  const lines = validateLines(body.items);
  const items: QuoteLine[] = [];
  const issues: QuoteIssue[] = [];

  for (const line of lines) {
    const nft = findNft(line.nftId);
    const edition = nft?.editions.find((item) => item.id === line.editionId);
    if (!nft || !edition) {
      issues.push({
        nftId: line.nftId,
        editionId: line.editionId,
        type: 'edition_unavailable',
        message: 'Edição indisponível.',
      });
      continue;
    }
    if (edition.status !== 'available' || edition.available === 0) {
      issues.push({
        nftId: nft.id,
        editionId: edition.id,
        type: 'sold_out',
        message: `A edição ${edition.label} de ${nft.name} esgotou.`,
        available: 0,
      });
    } else if (line.quantity > edition.available) {
      issues.push({
        nftId: nft.id,
        editionId: edition.id,
        type: 'insufficient_availability',
        message: `Só restam ${edition.available} unidade(s) de ${nft.name} (${edition.label}).`,
        available: edition.available,
      });
    }
    items.push({
      ...line,
      nft: toSummary(nft),
      tokenId: nft.tokenId,
      editionLabel: edition.label,
      unitPrice: nft.price,
      lineTotal: mulEth(nft.price, line.quantity),
    });
  }

  const subtotal = items.reduce((sum, item) => addEth(sum, item.lineTotal), '0');
  const coupon = resolveCoupon(body.couponCode);
  const discount = computeDiscount(subtotal, coupon);
  const networkFee = items.length ? NETWORK_FEE : '0';
  const total = addEth(subEth(subtotal, discount), networkFee);
  const fingerprint = fnv1a(
    JSON.stringify({
      items: items.map((item) => [
        item.nftId,
        item.editionId,
        item.quantity,
        item.unitPrice,
        item.nft.version,
      ]),
      issues: issues.map((issue) => [issue.nftId, issue.editionId, issue.type]),
      discount,
      networkFee,
      coupon: coupon?.status === 'applied' ? coupon.code : null,
    }),
  );

  if (options.context === 'checkout') scheduleCheckoutDisruption(items);

  return {
    items,
    subtotal,
    discount,
    networkFee,
    total,
    coupon,
    issues,
    fingerprint,
    issuedAt: new Date().toISOString(),
  };
}

/** Cenários "price-change" e "sold-out": alteram o primeiro item alguns segundos após a cotação do checkout. */
function scheduleCheckoutDisruption(items: QuoteLine[]): void {
  const { checkoutDisruption } = getScenario();
  const first = items[0];
  if (!checkoutDisruption || !first || !consumeOnce(`checkout-disruption:${checkoutDisruption}`))
    return;
  window.setTimeout(() => {
    if (checkoutDisruption === 'price-change') increaseNftPrice(first.nftId, 1.1);
    else setEditionAvailability(first.nftId, first.editionId, 0);
  }, 3000);
}
