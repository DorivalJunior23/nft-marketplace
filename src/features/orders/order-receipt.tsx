import { Link } from '@tanstack/react-router';

import { ArtworkImage } from '@/components/common/artwork-image';
import { CloseIcon, ThankYouIcon } from '@/components/icons';
import { NETWORKS, type Order } from '@/contracts';
import { formatEth } from '@/lib/money';
import { cn } from '@/lib/utils';

import { formatReceiptDate } from './format';

interface OrderReceiptProps {
  order: Order;
  /** Modal (desktop, Figma) ou folha em tela cheia (mobile). */
  layout: 'modal' | 'sheet';
  onClose?: () => void;
}

/** Recibo do pedido confirmado (Figma "Order Confirmation Modal"): snapshot imutável do pedido. */
export function OrderReceipt({ order, layout, onClose }: OrderReceiptProps) {
  const { receipt } = order;
  const network = NETWORKS[receipt.network];
  return (
    <article
      className={cn(
        'bg-surface-card text-cream relative flex flex-col',
        layout === 'modal' ? 'w-[578px] max-w-full' : 'w-full',
      )}
      aria-labelledby="recibo-titulo"
      data-testid="order-receipt"
    >
      <header className="flex flex-col items-center gap-4 px-6 pt-[22px] pb-5">
        <ThankYouIcon className="size-20" />
        <h2
          id="recibo-titulo"
          className="text-text-secondary text-center text-[16px] leading-4 font-bold"
        >
          Seus NFTs agora estão na sua carteira
        </h2>
      </header>
      <div className="bg-primary h-px w-full" aria-hidden="true" />
      <dl
        className={cn(
          'text-text-secondary grid gap-3 px-9 py-3',
          layout === 'modal'
            ? 'grid-cols-[auto_1px_auto_1px_auto_1px_auto] items-center justify-between'
            : 'grid-cols-2',
        )}
      >
        <div className="flex flex-col py-2.5">
          <dt className="text-[14px] leading-4 font-bold">ID da transação</dt>
          <dd className="text-[15px] leading-5" data-testid="receipt-transaction">
            {receipt.transactionId}
          </dd>
        </div>
        {layout === 'modal' ? (
          <span aria-hidden="true" className="bg-primary h-[31px] w-px" />
        ) : null}
        <div className="flex flex-col py-2.5">
          <dt className="text-[14px] leading-4">Data</dt>
          <dd className="text-[15px] leading-5">{formatReceiptDate(receipt.date)}</dd>
        </div>
        {layout === 'modal' ? (
          <span aria-hidden="true" className="bg-primary h-[31px] w-px" />
        ) : null}
        <div className="flex flex-col py-2.5">
          <dt className="text-[14px] leading-4">Total</dt>
          <dd className="text-[15px] leading-5" data-testid="receipt-total">
            {formatEth(receipt.total)}
          </dd>
        </div>
        {layout === 'modal' ? (
          <span aria-hidden="true" className="bg-primary h-[31px] w-px" />
        ) : null}
        <div className="flex flex-col py-2.5">
          <dt className="text-[14px] leading-4 font-bold">Carteira</dt>
          <dd className="text-[15px] leading-5">{receipt.walletName}</dd>
        </div>
      </dl>
      <div className="bg-primary h-px w-full" aria-hidden="true" />
      <div className="flex flex-col gap-3 px-11 pt-5 pb-12">
        <h3 className="text-[15px] leading-4 font-bold">Detalhes da transação</h3>
        <div className="border-primary/30 flex items-center justify-between border-b pb-3 text-[16px] leading-4">
          <span className="font-bold">NFTs</span>
          <span className="flex gap-12">
            <span className="font-bold">Edições</span>
            <span className="font-medium">Subtotal</span>
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {receipt.items.map((item) => (
            <li
              key={`${item.nftId}-${item.editionId}`}
              className="flex h-[70px] items-center justify-between gap-3"
              data-testid="receipt-item"
            >
              <div className="flex items-center gap-3">
                <ArtworkImage
                  artwork={item.artwork}
                  size={70}
                  alt=""
                  className="size-[70px] rounded-[8px]"
                />
                <div className="flex flex-col gap-1.5">
                  <p className="truncate text-[16px] leading-4 font-bold">{item.name}</p>
                  <p className="text-brand-secondary text-[14px] leading-4">
                    ID do token: {item.tokenId} · {item.editionLabel}
                  </p>
                </div>
              </div>
              <p className="flex items-center gap-12">
                <span className="text-text-secondary text-[14px] leading-4">
                  (x {item.quantity})
                </span>
                <span className="text-text-accent text-[18px] leading-4 font-bold">
                  {formatEth(item.lineTotal)}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <dl className="ml-auto flex w-[321px] max-w-full flex-col gap-3 pt-3">
          {receipt.couponCode ? (
            <div className="flex items-center justify-between text-[15px] leading-5">
              <dt>Desconto ({receipt.couponCode})</dt>
              <dd>(-) {formatEth(receipt.discount)}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-[15px] leading-5">
            <dt>Taxa de rede</dt>
            <dd className="text-[18px] leading-4">{formatEth(receipt.networkFee)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[16px] leading-4 font-bold">Total</dt>
            <dd className="text-text-accent text-[18px] leading-4 font-bold">
              {formatEth(receipt.total)}
            </dd>
          </div>
        </dl>
        <div className="border-primary/30 flex flex-col items-center gap-5 border-t pt-3">
          <p className="text-text-secondary text-center text-[14px] leading-[22px]">
            Transação confirmada na {network.name}. A propriedade foi transferida para sua carteira
            conectada e registrada na rede.
          </p>
          <a
            href={receipt.explorerUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="bg-primary text-ink hover:bg-primary-light focus-visible:ring-ring focus-visible:ring-offset-surface-card flex h-12 items-center rounded-[5px] px-4 text-[16px] leading-4 font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Ver no{' '}
            {network.id === 'ethereum'
              ? 'Etherscan'
              : network.id === 'polygon'
                ? 'Polygonscan'
                : 'Solscan'}
            <span className="sr-only"> (abre em nova aba, link simulado)</span>
          </a>
        </div>
      </div>
      <div className="bg-primary h-2.5 w-full" aria-hidden="true" />
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar recibo"
          className="text-primary hover:text-primary-light focus-visible:ring-ring absolute top-[17px] right-4 flex size-[18px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
        >
          <CloseIcon className="size-[18px]" />
        </button>
      ) : null}
      {layout === 'sheet' ? (
        <div className="px-6 pt-4 pb-8">
          <Link to="/pedidos" className="text-text-accent text-[14px] hover:underline">
            Ver todos os pedidos
          </Link>
        </div>
      ) : null}
    </article>
  );
}
