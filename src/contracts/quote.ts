import type { EthAmount, NetworkId } from './common';
import type { EditionId, NftSummary } from './nft';

export interface QuoteLineInput {
  nftId: string;
  editionId: EditionId;
  quantity: number;
}

export interface QuoteRequest {
  items: QuoteLineInput[];
  couponCode?: string | null;
  network?: NetworkId;
}

export type QuoteIssueType =
  'price_changed' | 'sold_out' | 'insufficient_availability' | 'edition_unavailable';

export interface QuoteIssue {
  nftId: string;
  editionId: EditionId;
  type: QuoteIssueType;
  message: string;
  previousPrice?: EthAmount;
  currentPrice?: EthAmount;
  available?: number;
}

export interface QuoteLine extends QuoteLineInput {
  nft: NftSummary;
  tokenId: string;
  editionLabel: string;
  unitPrice: EthAmount;
  lineTotal: EthAmount;
}

export type CouponStatus = 'applied' | 'invalid' | 'expired';

export interface QuoteCoupon {
  code: string;
  status: CouponStatus;
  description: string;
}

export interface Quote {
  items: QuoteLine[];
  subtotal: EthAmount;
  discount: EthAmount;
  networkFee: EthAmount;
  total: EthAmount;
  coupon: QuoteCoupon | null;
  issues: QuoteIssue[];
  /** Resumo determinístico de preços, disponibilidade, cupom e taxas; o pedido deve enviá-lo de volta. */
  fingerprint: string;
  issuedAt: string;
}
