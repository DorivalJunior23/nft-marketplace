import type { EthAmount } from './common';
import type { EditionId, NftEdition, NftSummary } from './nft';

export interface CartItem {
  id: string;
  nftId: string;
  editionId: EditionId;
  quantity: number;
  /** Snapshot atualizado pela API a cada leitura; reflete preço e disponibilidade correntes. */
  nft: NftSummary;
  edition: NftEdition;
  unitPrice: EthAmount;
  lineTotal: EthAmount;
}

export interface Cart {
  id: string;
  ownerType: 'guest' | 'user';
  items: CartItem[];
  subtotal: EthAmount;
  totalQuantity: number;
  version: number;
  updatedAt: string;
}

export interface AddCartItemRequest {
  nftId: string;
  editionId: EditionId;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
