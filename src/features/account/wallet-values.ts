import type { Wallet } from '@/contracts';

import type { WalletFormValues } from './wallet-form';

export function walletToValues(
  wallet: Wallet | null | undefined,
  fallback?: Partial<WalletFormValues>,
): WalletFormValues {
  return {
    displayName: wallet?.displayName ?? fallback?.displayName ?? '',
    walletAlias: wallet?.walletAlias ?? fallback?.walletAlias ?? '',
    network: wallet?.network ?? fallback?.network ?? ('' as WalletFormValues['network']),
    profileName: wallet?.profileName ?? fallback?.profileName ?? '',
    address: wallet?.address ?? fallback?.address ?? '',
    secondaryAddress: wallet?.secondaryAddress ?? fallback?.secondaryAddress ?? '',
    walletType:
      wallet?.walletType ?? fallback?.walletType ?? ('' as WalletFormValues['walletType']),
    referralCode: wallet?.referralCode ?? fallback?.referralCode ?? '',
    email: wallet?.email ?? fallback?.email ?? '',
    ensName: wallet?.ensName ?? fallback?.ensName ?? '',
  };
}
