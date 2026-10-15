import { Link, useRouter } from '@tanstack/react-router';
import { useRef } from 'react';
import { useWatch } from 'react-hook-form';

import { Container } from '@/components/common/container';
import { EmptyState } from '@/components/common/query-state';
import { ArrowLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { NETWORKS, type Wallet } from '@/contracts';
import { useIsDesktop } from '@/hooks/use-media-query';
import { formatEth } from '@/lib/money';
import { cn } from '@/lib/utils';

import { CollectorForm } from './components/collector-form';
import { ConnectionStatus } from './components/connection-status';
import { OrderItemsSummary } from './components/order-items-summary';
import { ReviewDialog } from './components/review-dialog';
import { WalletTypeOptions } from './components/wallet-type-options';
import { useCheckout, type CheckoutController } from './use-checkout';

function QuoteChangedBanner({ controller }: { controller: CheckoutController }) {
  if (!controller.quoteChanged && controller.submit.status !== 'error') return null;
  return (
    <div
      role="alert"
      className="border-amber/60 bg-amber/10 text-cream flex flex-col gap-2 rounded-[4px] border px-3 py-2 text-[13px] leading-4"
      data-testid="quote-changed"
    >
      <p>
        {controller.submit.status === 'error'
          ? controller.submit.message
          : 'Preço, disponibilidade ou taxas mudaram desde a última revisão. Confira o novo total antes de confirmar.'}
      </p>
      {controller.quoteChanged ? (
        <button
          type="button"
          onClick={controller.acknowledgeQuote}
          className="text-text-accent focus-visible:ring-ring self-start hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Entendi, usar os novos valores
        </button>
      ) : null}
    </div>
  );
}

function WalletSwitch({ controller }: { controller: CheckoutController }) {
  const { primary, secondary, selectedWallet, selectWallet } = controller;
  if (!secondary || !primary) return null;
  const usingSecondary = selectedWallet?.id === secondary.id;
  return (
    <label className="text-cream relative flex cursor-pointer items-center gap-2 text-[15px] leading-5">
      <input
        type="checkbox"
        className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none opacity-0"
        checked={usingSecondary}
        onChange={(event) => selectWallet(event.target.checked ? secondary : primary)}
      />
      <span
        aria-hidden="true"
        className={cn(
          'border-primary peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background flex size-[15px] items-center justify-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
          usingSecondary && 'bg-primary',
        )}
      />
      Usar outra carteira?
      <span className="text-text-secondary">
        ({usingSecondary ? secondary.walletAlias : primary.walletAlias})
      </span>
    </label>
  );
}

function ConfirmButton({
  controller,
  className,
  buttonRef,
}: {
  controller: CheckoutController;
  className?: string;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const disabled =
    controller.isPreparing ||
    controller.blockingIssues.length > 0 ||
    (controller.cart.data?.items.length ?? 0) === 0 ||
    controller.quoteChanged ||
    !controller.selectedWallet;
  return (
    <Button
      ref={buttonRef}
      type="submit"
      form="checkout-form"
      className={className}
      disabled={disabled}
      aria-busy={controller.isPreparing || undefined}
      data-testid="pay-button"
    >
      {controller.connection.status === 'connecting' ? 'Conectando carteira…' : 'Confirmar compra'}
    </Button>
  );
}

function NoWalletNotice() {
  return (
    <EmptyState
      title="Cadastre uma carteira para pagar"
      description="O pagamento usa as carteiras cadastradas na sua conta."
      action={
        <Button asChild size="sm">
          <Link to="/carteiras">Ir para Carteiras</Link>
        </Button>
      }
    />
  );
}

function DesktopCheckout({ controller }: { controller: CheckoutController }) {
  const { form, cart, quote, couponCode, selectedWallet, connection } = controller;
  const payRef = useRef<HTMLButtonElement>(null);
  const walletType = useWatch({ control: form.control, name: 'walletType' });
  const network = useWatch({ control: form.control, name: 'network' });
  const email = useWatch({ control: form.control, name: 'email' });
  const hasItems = (cart.data?.items.length ?? 0) > 0;

  return (
    <Container className="flex flex-col gap-8 pt-8">
      <nav aria-label="Trilha de navegação" className="text-cream text-[15px] leading-4 font-bold">
        <Link to="/" className="hover:text-text-accent">
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <Link to="/mercado" className="hover:text-text-accent">
          Mercado
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Pagamento</span>
      </nav>
      {!cart.isPending && !hasItems ? (
        <EmptyState
          title="Seu carrinho está vazio"
          description="Adicione NFTs antes de ir para o pagamento. Se você acabou de confirmar uma compra, ela está em Meus pedidos."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="sm">
                <Link to="/mercado">Explorar o mercado</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/pedidos">Meus pedidos</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row">
          <form
            id="checkout-form"
            onSubmit={controller.startReview}
            noValidate
            className="flex flex-1 flex-col gap-3"
            aria-labelledby="perfil-colecionador"
          >
            <h1 id="perfil-colecionador" className="text-cream text-[17px] leading-4 font-bold">
              Perfil do colecionador
            </h1>
            {controller.wallets.data && controller.wallets.data.length === 0 ? (
              <NoWalletNotice />
            ) : null}
            <div className="flex flex-col gap-6 pt-3">
              <CollectorForm form={form} variant="account" columns={2} />
              <WalletSwitch controller={controller} />
              <ConnectionStatus
                connection={connection}
                onDisconnect={() => void controller.disconnect()}
              />
            </div>
          </form>
          <aside className="flex w-full flex-col gap-5 lg:w-[340px] lg:shrink-0 xl:w-[405px]">
            <OrderItemsSummary
              cart={cart.data}
              quote={quote.data}
              isLoading={cart.isPending || (hasItems && quote.isPending)}
              couponCode={couponCode}
            />
            <QuoteChangedBanner controller={controller} />
            <WalletTypeOptions
              variant="desktop"
              value={walletType}
              onChange={(value) => form.setValue('walletType', value, { shouldValidate: true })}
            />
            <ConfirmButton
              controller={controller}
              buttonRef={payRef}
              className="h-[45px] w-full rounded-[8px] text-[15px] font-bold"
            />
          </aside>
        </div>
      )}
      <ReviewDialog
        open={controller.reviewOpen}
        onOpenChange={(open) => (open ? undefined : controller.closeReview())}
        cart={controller.snapshot?.cart ?? cart.data}
        quote={controller.snapshot?.quote ?? quote.data}
        wallet={selectedWallet}
        network={network}
        email={email}
        submit={controller.submit}
        onConfirm={() => void controller.confirm()}
        triggerRef={payRef}
      />
    </Container>
  );
}

function MobileWalletCard({
  wallet,
  selected,
  onSelect,
}: {
  wallet: Wallet;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'bg-surface-card focus-visible:ring-ring relative flex h-[93px] w-full items-start gap-5 rounded-[14px] px-5 py-4 text-left focus-visible:ring-2 focus-visible:outline-none',
        selected && 'shadow-[0_20px_20px_rgb(10_6_4/0.45)]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-6 flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px]',
          selected ? 'border-primary' : 'border-border-soft',
        )}
      >
        {selected ? <span className="bg-primary size-2 rounded-full" /> : null}
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="text-cream text-[16px] leading-4 font-bold">{wallet.walletAlias}</span>
        <span className="text-text-secondary text-[14px] leading-[22px]">
          {wallet.ensName
            ? `${wallet.ensName}.eth`
            : `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4).toUpperCase()}`}
          <br />
          Rede {NETWORKS[wallet.network].name}
        </span>
      </span>
    </button>
  );
}

function MobileCheckout({ controller }: { controller: CheckoutController }) {
  const router = useRouter();
  const { form, cart, quote, couponCode, selectedWallet, connection } = controller;
  const payRef = useRef<HTMLButtonElement>(null);
  const walletType = useWatch({ control: form.control, name: 'walletType' });
  const network = useWatch({ control: form.control, name: 'network' });
  const email = useWatch({ control: form.control, name: 'email' });
  const wallets = controller.wallets.data ?? [];
  const hasItems = (cart.data?.items.length ?? 0) > 0;

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-7 pt-8 pb-8">
      <div className="flex h-11 items-center gap-6">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="border-border bg-surface-raised text-brand-secondary focus-visible:ring-ring flex size-[35px] items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Voltar"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <h1 className="text-cream text-[20px] leading-4 font-bold">Pagamento com carteira</h1>
      </div>
      {!cart.isPending && !hasItems ? (
        <EmptyState
          title="Seu carrinho está vazio"
          description="Se você acabou de confirmar uma compra, ela está em Meus pedidos."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="sm">
                <Link to="/mercado">Explorar o mercado</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/pedidos">Meus pedidos</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <form
          id="checkout-form"
          onSubmit={controller.startReview}
          noValidate
          className="flex flex-1 flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-cream text-[16px] leading-4 font-bold">
              {connection.status === 'connected' ? 'Carteira conectada' : 'Carteira'}
            </span>
            {connection.status === 'connected' ? (
              <button
                type="button"
                onClick={() => void controller.disconnect()}
                className="text-text-accent focus-visible:ring-ring text-[14px] leading-4 font-bold focus-visible:ring-2 focus-visible:outline-none"
              >
                Trocar carteira
              </button>
            ) : null}
          </div>
          {wallets.length === 0 ? (
            <NoWalletNotice />
          ) : (
            <div role="radiogroup" aria-label="Carteira cadastrada" className="flex flex-col gap-5">
              {[...wallets]
                .sort(
                  (a, b) => (a.kind === 'secondary' ? -1 : 1) - (b.kind === 'secondary' ? -1 : 1),
                )
                .map((wallet) => (
                  <MobileWalletCard
                    key={wallet.id}
                    wallet={wallet}
                    selected={selectedWallet?.id === wallet.id}
                    onSelect={() => controller.selectWallet(wallet)}
                  />
                ))}
            </div>
          )}
          <ConnectionStatus connection={connection} />
          <WalletTypeOptions
            variant="mobile"
            value={walletType}
            onChange={(value) => form.setValue('walletType', value, { shouldValidate: true })}
          />
          <details
            className="group bg-surface-card rounded-[14px]"
            open={Object.keys(form.formState.errors).length > 0}
          >
            <summary className="text-cream flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[16px] leading-4 font-bold [&::-webkit-details-marker]:hidden">
              Dados do colecionador
              <span
                aria-hidden="true"
                className="text-text-accent transition-transform group-open:rotate-180"
              >
                ⌄
              </span>
            </summary>
            <div className="px-4 pb-4">
              <CollectorForm form={form} variant="mobile" columns={1} />
            </div>
          </details>
          <details className="group bg-surface-card rounded-[14px]">
            <summary className="text-cream flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[16px] leading-4 font-bold [&::-webkit-details-marker]:hidden">
              Seus NFTs ({cart.data?.totalQuantity ?? 0})
              <span
                aria-hidden="true"
                className="text-text-accent transition-transform group-open:rotate-180"
              >
                ⌄
              </span>
            </summary>
            <div className="px-4 pb-4">
              <OrderItemsSummary
                cart={cart.data}
                quote={quote.data}
                isLoading={cart.isPending || (hasItems && quote.isPending)}
                couponCode={couponCode}
                compact
              />
            </div>
          </details>
          <QuoteChangedBanner controller={controller} />
          <div className="mt-auto flex flex-col gap-6 pt-4">
            <p className="flex items-center justify-end gap-7">
              <span className="text-cream text-[16px] leading-4 font-bold">Total:</span>
              <span
                className="text-text-accent text-[18px] leading-4 font-bold"
                data-testid="checkout-total-mobile"
              >
                {quote.data ? formatEth(quote.data.total) : '—'}
              </span>
            </p>
            <ConfirmButton
              controller={controller}
              buttonRef={payRef}
              className="h-[60px] w-full rounded-full bg-[linear-gradient(90deg,#D28A4C,rgb(210_138_76/0.8))] text-[15px] font-bold"
            />
          </div>
        </form>
      )}
      <ReviewDialog
        open={controller.reviewOpen}
        onOpenChange={(open) => (open ? undefined : controller.closeReview())}
        cart={controller.snapshot?.cart ?? cart.data}
        quote={controller.snapshot?.quote ?? quote.data}
        wallet={selectedWallet}
        network={network}
        email={email}
        submit={controller.submit}
        onConfirm={() => void controller.confirm()}
        triggerRef={payRef}
      />
    </div>
  );
}

export function CheckoutPage() {
  const isDesktop = useIsDesktop();
  const controller = useCheckout();
  return isDesktop ? (
    <DesktopCheckout controller={controller} />
  ) : (
    <MobileCheckout controller={controller} />
  );
}
