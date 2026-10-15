import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { Container } from '@/components/common/container';
import { EmptyState, ErrorState } from '@/components/common/query-state';
import { Shimmer } from '@/components/common/shimmer';
import { ArrowLeftIcon, TrashIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/contracts';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { nftRelatedOptions } from '@/features/catalog/queries';
import { QuantityStepper } from '@/features/nft-detail/quantity-stepper';
import { useIsDesktop } from '@/hooks/use-media-query';
import { formatEth } from '@/lib/money';
import { cn } from '@/lib/utils';

import { CartNotices } from './components/cart-notices';
import { CartSummary } from './components/cart-summary';
import { useRemoveCartItem, useUpdateCartItem } from './mutations';
import { useCart, useCartOwnerId } from './queries';
import { useCouponCode, useQuote } from './quote';
import { useCartNotices } from './use-cart-notices';

function useCartPageState() {
  const cart = useCart();
  const ownerId = useCartOwnerId();
  const couponCode = useCouponCode();
  const quote = useQuote(ownerId, cart.data, couponCode, 'cart');
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { notices, dismiss } = useCartNotices(cart.data);
  const { user } = useRequireAuth();
  const navigate = useNavigate();

  const blocking = (quote.data?.issues ?? []).some((issue) => issue.type !== 'price_changed');
  // Visitante vai ao login e volta direto ao pagamento, não ao carrinho.
  const checkout = () =>
    user
      ? void navigate({ to: '/pagamento' })
      : void navigate({ to: '/entrar', search: { redirect: '/pagamento' } });

  return { cart, quote, updateItem, removeItem, notices, dismiss, blocking, checkout };
}

function maxFor(item: CartItem): number {
  return Math.max(1, Math.min(item.edition.maxPerOrder, item.edition.available));
}

/** Linha da tabela do carrinho desktop (Figma): arte 70px, nome e ID, preço, stepper, total e lixeira. */
function CartRow({
  item,
  onQuantity,
  onRemove,
  busy,
}: {
  item: CartItem;
  onQuantity: (q: number) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const soldOut = item.edition.available === 0;
  return (
    <li
      className={cn(
        'bg-surface-card grid h-[70px] grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_24px] items-center gap-x-3 pr-6 xl:grid-cols-[250px_1fr_1fr_1fr_24px] xl:gap-x-0',
        busy && 'opacity-70',
      )}
      aria-busy={busy || undefined}
      data-testid="cart-item"
    >
      <div className="flex h-full min-w-0 items-center gap-4">
        <Link
          to="/nft/$nftId"
          params={{ nftId: item.nftId }}
          className="focus-visible:ring-ring shrink-0 focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArtworkImage
            artwork={item.nft.artwork}
            size={70}
            alt=""
            className="size-[70px] rounded-[6px]"
          />
        </Link>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="text-cream truncate text-[16px] leading-4 font-bold">
            <Link
              to="/nft/$nftId"
              params={{ nftId: item.nftId }}
              className="hover:text-text-accent focus-visible:outline-none"
            >
              {item.nft.name}
            </Link>
          </h3>
          <p className="text-brand-secondary text-[14px] leading-4">
            ID do token: {item.nft.tokenId} · Edição {item.edition.label}
            {soldOut ? <span className="text-coral ml-2 font-bold">Esgotada</span> : null}
          </p>
        </div>
      </div>
      <p
        className="text-text-secondary text-center text-[16px] leading-4 font-bold"
        data-testid="cart-item-price"
      >
        {formatEth(item.unitPrice)}
      </p>
      <div className="flex justify-center">
        <QuantityStepper
          size="sm"
          value={item.quantity}
          max={maxFor(item)}
          onChange={onQuantity}
          disabled={busy || soldOut}
          label={`Quantidade de ${item.nft.name}`}
        />
      </div>
      <p
        className="text-text-accent text-right text-[16px] leading-4 font-bold"
        data-testid="cart-item-total"
      >
        {formatEth(item.lineTotal)}
      </p>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${item.nft.name} do carrinho`}
        className="text-brand-secondary hover:text-coral focus-visible:ring-ring flex size-6 items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
      >
        <TrashIcon className="size-6" />
      </button>
    </li>
  );
}

function RelatedStrip() {
  const related = useQuery(nftRelatedOptions('emerald-ape-0042'));
  return (
    <section aria-labelledby="tambem-viram" className="flex flex-col gap-8">
      <h2
        id="tambem-viram"
        className="border-primary/30 text-text-accent border-b pb-3 text-[17px] leading-4 font-bold"
      >
        Colecionadores também viram
      </h2>
      <ul className="grid grid-cols-3 gap-7 lg:grid-cols-4 xl:flex xl:justify-between">
        {(related.data ?? Array.from({ length: 5 }, () => null)).map((item, index) => (
          <li
            key={item?.id ?? index}
            className="flex w-full max-w-[219px] flex-col gap-3 xl:w-[219px]"
          >
            {item ? (
              <>
                <Link
                  to="/nft/$nftId"
                  params={{ nftId: item.id }}
                  className="bg-surface-card focus-visible:ring-ring block aspect-[219/255] w-full px-1 pt-5 focus-visible:ring-2 focus-visible:outline-none xl:aspect-auto xl:h-[255px]"
                  aria-label={`${item.name}, ver detalhes`}
                >
                  <ArtworkImage
                    artwork={item.artwork}
                    size={212}
                    alt=""
                    className="mx-auto aspect-square h-auto w-full max-w-[212px] rounded-[13px] xl:size-[212px]"
                  />
                </Link>
                <div className="flex flex-col">
                  <p className="text-cream truncate text-[15px] leading-5">{item.name}</p>
                  <p className="text-text-accent text-[16px] leading-4 font-bold">
                    {formatEth(item.price)}
                  </p>
                </div>
              </>
            ) : (
              <Shimmer className="aspect-[219/255] w-full rounded-none xl:h-[255px]" />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DesktopCart() {
  const { cart, quote, updateItem, removeItem, notices, dismiss, blocking, checkout } =
    useCartPageState();
  const items = cart.data?.items ?? [];

  return (
    <Container className="flex flex-col gap-24 pt-8">
      <section aria-labelledby="carrinho-titulo" className="flex flex-col gap-3">
        <nav
          aria-label="Trilha de navegação"
          className="text-cream text-[15px] leading-4 font-bold"
        >
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>
          <span aria-hidden="true"> / </span>
          <Link to="/mercado" className="hover:text-text-accent">
            Mercado
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Carrinho</span>
        </nav>
        <h1 id="carrinho-titulo" className="sr-only">
          Carrinho de NFTs
        </h1>
        <div className="flex flex-col justify-between gap-8 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-3 xl:w-[782px] xl:flex-none">
            <div
              className="border-primary/30 text-cream grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_24px] gap-x-3 border-b pr-6 pb-3 text-[16px] leading-4 xl:grid-cols-[250px_1fr_1fr_1fr_24px] xl:gap-x-0"
              role="presentation"
            >
              <span className="font-bold">NFTs</span>
              <span className="text-center font-medium">Preço</span>
              <span className="text-center font-bold">Edições</span>
              <span className="text-right font-medium">Total</span>
              <span />
            </div>
            {cart.isPending ? (
              <ul className="flex flex-col gap-3" aria-label="Carregando carrinho">
                {['a', 'b', 'c'].map((key) => (
                  <li key={key}>
                    <Shimmer className="h-[70px] w-full rounded-none" />
                  </li>
                ))}
              </ul>
            ) : cart.isError ? (
              <ErrorState
                error={cart.error}
                onRetry={() => void cart.refetch()}
                title="Não foi possível carregar o carrinho"
                compact
              />
            ) : items.length === 0 ? (
              <EmptyState
                title="Seu carrinho está vazio"
                description="Explore o mercado e adicione NFTs para continuar."
                action={
                  <Button asChild size="sm">
                    <Link to="/mercado">Explorar o mercado</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    busy={
                      (updateItem.isPending && updateItem.variables?.lineId === item.id) ||
                      (removeItem.isPending && removeItem.variables === item.id)
                    }
                    onQuantity={(quantity) => updateItem.mutate({ lineId: item.id, quantity })}
                    onRemove={() => removeItem.mutate(item.id)}
                  />
                ))}
              </ul>
            )}
          </div>
          <CartSummary
            variant="desktop"
            quote={quote.data}
            isLoading={items.length > 0 && quote.isPending}
            isRefreshing={quote.isFetching && !quote.isPending}
            error={quote.error}
            notice={<CartNotices notices={notices} onDismiss={dismiss} />}
            cta={
              <div className="flex flex-col items-center gap-3">
                <Button
                  size="none"
                  className="h-10 w-full rounded-[3px] text-[15px] font-bold"
                  disabled={items.length === 0 || blocking || quote.isPending}
                  onClick={checkout}
                  data-testid="checkout-button"
                >
                  Conectar e finalizar
                </Button>
                <Link
                  to="/mercado"
                  className="text-cream hover:text-text-accent text-[14px] leading-4"
                >
                  Continuar explorando
                </Link>
                {blocking ? (
                  <p role="alert" className="text-coral text-center text-[13px] leading-4">
                    Ajuste os itens indisponíveis para finalizar a compra.
                  </p>
                ) : null}
              </div>
            }
          />
        </div>
      </section>
      <RelatedStrip />
    </Container>
  );
}

function MobileCartItem({
  item,
  onQuantity,
  onRemove,
  busy,
}: {
  item: CartItem;
  onQuantity: (q: number) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const soldOut = item.edition.available === 0;
  const circle =
    'flex size-6 items-center justify-center rounded-full border border-border bg-surface-raised text-cream focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40';
  return (
    <li
      className={cn(
        'bg-surface-card relative flex h-[100px] rounded-[14px] shadow-[0_6px_20px_rgb(10_6_4/0.45)]',
        busy && 'opacity-70',
      )}
      aria-busy={busy || undefined}
      data-testid="cart-item"
    >
      <ArtworkImage
        artwork={item.nft.artwork}
        size={100}
        alt=""
        className="size-[100px] rounded-[14px]"
      />
      <div className="flex flex-1 flex-col justify-between px-2 py-3">
        <h3 className="text-cream truncate text-[15px] leading-4 font-bold">{item.nft.name}</h3>
        <p className="text-text-secondary text-[14px] leading-4">
          Edição: {item.edition.label}
          {soldOut ? <span className="text-coral ml-2 font-bold">Esgotada</span> : null}
        </p>
        <p
          className="text-text-accent text-[18px] leading-4 font-bold"
          data-testid="cart-item-total"
        >
          {formatEth(item.lineTotal)}
        </p>
      </div>
      <div className="flex flex-col items-end justify-between py-2 pr-3">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${item.nft.name} do carrinho`}
          className="text-primary focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
        >
          <TrashIcon className="size-5" />
        </button>
        <div
          className="flex items-center gap-3"
          role="group"
          aria-label={`Quantidade de ${item.nft.name}`}
        >
          <button
            type="button"
            className={circle}
            onClick={() => onQuantity(item.quantity - 1)}
            disabled={busy || item.quantity <= 1}
            aria-label="Diminuir quantidade"
          >
            <span aria-hidden="true" className="block h-0.5 w-[9px] bg-current" />
          </button>
          <output
            className="text-cream min-w-[10px] text-center text-[16px] leading-[22px]"
            aria-live="polite"
          >
            {item.quantity}
          </output>
          <button
            type="button"
            className={circle}
            onClick={() => onQuantity(item.quantity + 1)}
            disabled={busy || soldOut || item.quantity >= maxFor(item)}
            aria-label="Aumentar quantidade"
          >
            <span aria-hidden="true" className="text-[21px] leading-4">
              +
            </span>
          </button>
        </div>
      </div>
    </li>
  );
}

function MobileCart() {
  const router = useRouter();
  const { cart, quote, updateItem, removeItem, notices, dismiss, blocking, checkout } =
    useCartPageState();
  const items = cart.data?.items ?? [];

  return (
    <div className="flex min-h-dvh flex-col pt-8">
      <div className="flex flex-col gap-5 px-7">
        <div className="flex h-11 items-center gap-6">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="border-border bg-surface-raised text-brand-secondary focus-visible:ring-ring flex size-[35px] items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Voltar"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
          <h1 className="text-cream text-[20px] leading-4 font-bold">Carrinho de NFTs</h1>
        </div>
        {cart.isPending ? (
          <ul className="flex flex-col gap-5" aria-label="Carregando carrinho">
            {['a', 'b'].map((key) => (
              <li key={key}>
                <Shimmer className="h-[100px] w-full rounded-[14px]" />
              </li>
            ))}
          </ul>
        ) : cart.isError ? (
          <ErrorState
            error={cart.error}
            onRetry={() => void cart.refetch()}
            title="Não foi possível carregar o carrinho"
            compact
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Seu carrinho está vazio"
            action={
              <Button asChild size="sm">
                <Link to="/mercado">Explorar o mercado</Link>
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-5 pb-6">
            {items.map((item) => (
              <MobileCartItem
                key={item.id}
                item={item}
                busy={
                  (updateItem.isPending && updateItem.variables?.lineId === item.id) ||
                  (removeItem.isPending && removeItem.variables === item.id)
                }
                onQuantity={(quantity) => updateItem.mutate({ lineId: item.id, quantity })}
                onRemove={() => removeItem.mutate(item.id)}
              />
            ))}
          </ul>
        )}
      </div>
      <div className="bg-surface-card mt-auto flex flex-col gap-8 rounded-t-[40px] px-6 pt-6 pb-9">
        <CartSummary
          variant="mobile"
          heading={false}
          quote={quote.data}
          isLoading={items.length > 0 && quote.isPending}
          isRefreshing={quote.isFetching && !quote.isPending}
          error={quote.error}
          notice={<CartNotices notices={notices} onDismiss={dismiss} />}
          cta={
            <button
              type="button"
              onClick={checkout}
              disabled={items.length === 0 || blocking || quote.isPending}
              className="text-ink focus-visible:ring-ring focus-visible:ring-offset-surface-card mt-2 flex h-[60px] w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,#D28A4C,rgb(210_138_76/0.8))] text-[16px] leading-4 font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
              data-testid="checkout-button"
            >
              Conectar e finalizar
            </button>
          }
        />
      </div>
    </div>
  );
}

export function CartPage() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopCart /> : <MobileCart />;
}
