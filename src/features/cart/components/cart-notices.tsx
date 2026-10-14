import { CloseIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

import type { CartNotice } from '../use-cart-notices';

/** Avisos de alteração em tempo real (preço/disponibilidade), com ícone além da cor. */
export function CartNotices({
  notices,
  onDismiss,
  className,
}: {
  notices: CartNotice[];
  onDismiss: (id: string) => void;
  className?: string;
}) {
  if (notices.length === 0) return null;
  return (
    <ul
      className={cn('flex flex-col gap-2', className)}
      aria-label="Alterações recentes no carrinho"
      data-testid="cart-notices"
    >
      {notices.map((notice) => (
        <li
          key={notice.id}
          role="status"
          className={cn(
            'flex items-start gap-2 rounded-[4px] border px-3 py-2 text-[13px] leading-4',
            notice.kind === 'price'
              ? 'border-amber/60 bg-amber/10 text-cream'
              : 'border-error/60 bg-error/10 text-cream',
          )}
        >
          <span aria-hidden="true" className="text-text-accent shrink-0 font-bold">
            {notice.kind === 'price' ? '↻' : '!'}
          </span>
          <span className="flex-1">{notice.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(notice.id)}
            aria-label="Dispensar aviso"
            className="text-text-secondary hover:text-cream focus-visible:ring-ring shrink-0 focus-visible:ring-2 focus-visible:outline-none"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
