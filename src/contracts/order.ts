import type { EthAmount, NetworkId } from './common';
import type { EditionId, ArtworkKey } from './nft';
import type { QuoteLineInput } from './quote';
import type { WalletType } from './wallet';

export type OrderStatus = 'pending' | 'confirmed' | 'declined';

export interface CollectorProfileInput {
  displayName: string;
  username: string;
  profileName: string;
  email: string;
  network: NetworkId;
  walletAddress: string;
  walletType: WalletType;
  secondaryAddress?: string;
  referralCode: string;
  ensName: string;
  note?: string;
}

export interface CreateOrderRequest {
  items: QuoteLineInput[];
  couponCode?: string | null;
  quoteFingerprint: string;
  walletId: string;
  network: NetworkId;
  collector: CollectorProfileInput;
}

export interface OrderReceiptItem {
  nftId: string;
  name: string;
  tokenId: string;
  artwork: ArtworkKey;
  editionId: EditionId;
  editionLabel: string;
  quantity: number;
  unitPrice: EthAmount;
  lineTotal: EthAmount;
}

/** Snapshot imutável do pedido no momento da confirmação. */
export interface OrderReceipt {
  transactionId: string;
  explorerUrl: string;
  network: NetworkId;
  walletName: string;
  walletType: WalletType;
  date: string;
  items: OrderReceiptItem[];
  subtotal: EthAmount;
  discount: EthAmount;
  couponCode: string | null;
  networkFee: EthAmount;
  total: EthAmount;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  receipt: OrderReceipt;
  declineReason: string | null;
}
