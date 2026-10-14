import type { NetworkId } from './common';

export type WalletKind = 'primary' | 'secondary';
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase';
export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'rejected';

/** Ordem das opções em "Carteira e rede" no Figma. */
export const WALLET_TYPES: ReadonlyArray<{ id: WalletType; name: string }> = [
  { id: 'walletconnect', name: 'WalletConnect' },
  { id: 'metamask', name: 'MetaMask' },
  { id: 'coinbase', name: 'Coinbase Wallet' },
];

export interface Wallet {
  id: string;
  kind: WalletKind;
  displayName: string;
  walletAlias: string;
  network: NetworkId;
  profileName: string;
  address: string;
  secondaryAddress: string | null;
  walletType: WalletType;
  referralCode: string;
  email: string;
  ensName: string;
  connection: WalletConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

export type WalletInput = Omit<Wallet, 'id' | 'connection' | 'createdAt' | 'updatedAt'>;

export interface WalletConnectRequest {
  network: NetworkId;
}

export interface WalletConnectResponse {
  walletId: string;
  status: 'connected';
  address: string;
  network: NetworkId;
}
