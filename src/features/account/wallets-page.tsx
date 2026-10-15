import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/common/query-state';
import { Shimmer } from '@/components/common/shimmer';
import { cn } from '@/lib/utils';

import { AccountLayout } from './account-layout';
import { useWallets } from './queries';
import { WalletForm, type WalletFormValues } from './wallet-form';
import { walletToValues } from './wallet-values';

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-cream text-[17px] leading-4 font-bold">{title}</h2>
        {action}
      </div>
      {description ? (
        <p className="text-text-secondary text-[14px] leading-[15px]">{description}</p>
      ) : null}
    </div>
  );
}

/** Carteiras (Figma): formulário da principal e seção da secundária com "Igual à carteira principal". */
export function WalletsPage() {
  const wallets = useWallets();
  const primary = wallets.data?.find((wallet) => wallet.kind === 'primary') ?? null;
  const secondary = wallets.data?.find((wallet) => wallet.kind === 'secondary') ?? null;
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [copyPrimary, setCopyPrimary] = useState(false);

  const secondaryInitial = useMemo<Partial<WalletFormValues> | undefined>(() => {
    if (!copyPrimary || !primary) return undefined;
    const values = walletToValues(primary);
    return { ...values, walletAlias: 'Reserva', secondaryAddress: '' };
  }, [copyPrimary, primary]);

  const showSecondaryForm = Boolean(secondary) || secondaryOpen;

  return (
    <AccountLayout title="Carteiras">
      {wallets.isPending ? (
        <div
          className="flex flex-col gap-6"
          role="status"
          aria-busy="true"
          aria-label="Carregando carteiras"
        >
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-10 w-full" />
          <Shimmer className="h-10 w-full" />
        </div>
      ) : wallets.isError ? (
        <ErrorState
          error={wallets.error}
          onRetry={() => void wallets.refetch()}
          title="Não foi possível carregar as carteiras"
        />
      ) : (
        <>
          <section aria-labelledby="carteira-principal" className="flex flex-col gap-8">
            <SectionHeading
              title="Carteira principal"
              description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
              action={
                primary ? (
                  <span className="text-text-accent text-[16px] leading-4 font-medium">
                    {primary.walletAlias}
                  </span>
                ) : (
                  <span className="text-text-accent text-[16px] leading-4 font-medium">
                    Adicionar
                  </span>
                )
              }
            />
            <WalletForm kind="primary" wallet={primary} />
          </section>

          <section aria-labelledby="carteira-secundaria" className="flex flex-col gap-3 pt-2">
            <SectionHeading
              title="Carteira secundária"
              action={
                <div className="flex items-center gap-6">
                  {primary ? (
                    <label className="text-cream relative flex cursor-pointer items-center gap-2 text-[14px] leading-4">
                      <input
                        type="checkbox"
                        className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none opacity-0"
                        checked={copyPrimary}
                        onChange={(event) => {
                          setCopyPrimary(event.target.checked);
                          if (event.target.checked) setSecondaryOpen(true);
                        }}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          'border-primary peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background flex size-4 items-center justify-center rounded-full border-[1.5px] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
                          copyPrimary && 'bg-primary',
                        )}
                      />
                      Igual à carteira principal
                    </label>
                  ) : null}
                  {!secondary ? (
                    <button
                      type="button"
                      onClick={() => setSecondaryOpen((open) => !open)}
                      aria-expanded={showSecondaryForm}
                      className="text-text-accent focus-visible:ring-ring text-[16px] leading-4 font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {secondaryOpen ? 'Cancelar' : 'Adicionar'}
                    </button>
                  ) : null}
                </div>
              }
            />
            {showSecondaryForm ? (
              <div className="pt-5">
                <WalletForm
                  kind="secondary"
                  wallet={secondary}
                  initialValues={secondaryInitial}
                  onSaved={() => setSecondaryOpen(false)}
                />
              </div>
            ) : (
              <p className="text-text-secondary text-[14px] leading-[15px]">
                Você ainda não adicionou uma carteira secundária.
              </p>
            )}
          </section>
        </>
      )}
    </AccountLayout>
  );
}
