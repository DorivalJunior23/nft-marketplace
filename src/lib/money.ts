import Big from 'big.js';

import type { EthAmount } from '@/contracts';

// Arredondamento comercial (half-up) e 18 casas como limite de precisão do ETH.
Big.DP = 18;
Big.RM = Big.roundHalfUp;

export function eth(value: EthAmount | number): Big {
  return new Big(value);
}

export function addEth(a: EthAmount, b: EthAmount): EthAmount {
  return eth(a).plus(b).toString();
}

export function subEth(a: EthAmount, b: EthAmount): EthAmount {
  return eth(a).minus(b).toString();
}

export function mulEth(a: EthAmount, factor: number | EthAmount): EthAmount {
  return eth(a).times(factor).toString();
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  return eth(a).cmp(b) as -1 | 0 | 1;
}

export function isZeroEth(a: EthAmount): boolean {
  return eth(a).eq(0);
}

/** Arredonda para `dp` casas, sem perder precisão intermediária. */
export function roundEth(a: EthAmount, dp = 6): EthAmount {
  return eth(a).round(dp).toString();
}

/**
 * Formata como no layout: pelo menos duas casas, até `maxDp` sem zeros à direita.
 * Ex.: "1.19" -> "1.19 ETH", "0.016" -> "0.016 ETH", "26.846" -> "26.846 ETH".
 */
export function formatEth(value: EthAmount, { suffix = true, maxDp = 6 } = {}): string {
  const fixed = eth(value).toFixed(maxDp);
  const [int, frac = ''] = fixed.split('.');
  const trimmed = frac.replace(/0+$/, '');
  const decimals = trimmed.length < 2 ? trimmed.padEnd(2, '0') : trimmed;
  const text = `${int}.${decimals}`;
  return suffix ? `${text} ETH` : text;
}

/** Desconto como no layout: "(-) 00.00" quando zero, "(-) 1.20 ETH" quando houver. */
export function formatDiscount(value: EthAmount): string {
  if (isZeroEth(value)) return '(-) 00.00';
  return `(-) ${formatEth(value)}`;
}

/** Entrada de usuário "1,19" ou "1.19" -> "1.19"; retorna null se inválida. */
export function parseEthInput(input: string): EthAmount | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return eth(normalized).toString();
}
