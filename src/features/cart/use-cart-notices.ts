import { useCallback, useState } from 'react';

import type { Cart, NftUpdatedEvent } from '@/contracts';
import { formatEth } from '@/lib/money';
import { useNftUpdates } from '@/realtime/hooks';

export interface CartNotice {
  id: string;
  kind: 'price' | 'availability';
  message: string;
}

/**
 * Converte eventos nft.updated que afetam itens do carrinho em avisos legíveis
 * ("o preço mudou", "a edição esgotou"), para o resumo informar a alteração.
 */
export function useCartNotices(cart: Cart | undefined): {
  notices: CartNotice[];
  dismiss: (id: string) => void;
  clear: () => void;
} {
  const [notices, setNotices] = useState<CartNotice[]>([]);

  useNftUpdates((event: NftUpdatedEvent, previous) => {
    const item = cart?.items.find((line) => line.nftId === event.resource.id);
    if (!item) return;
    const edition = event.data.editions.find((candidate) => candidate.id === item.editionId);
    const next: CartNotice[] = [];
    if (previous && previous.price !== event.data.price) {
      next.push({
        id: `${event.eventId}:price`,
        kind: 'price',
        message: `O preço de ${item.nft.name} mudou de ${formatEth(previous.price)} para ${formatEth(event.data.price)}.`,
      });
    }
    if (edition && (edition.available === 0 || edition.available < item.quantity)) {
      next.push({
        id: `${event.eventId}:availability`,
        kind: 'availability',
        message:
          edition.available === 0
            ? `A edição ${edition.label} de ${item.nft.name} esgotou.`
            : `Restam só ${edition.available} unidade(s) da edição ${edition.label} de ${item.nft.name}.`,
      });
    }
    if (next.length) setNotices((current) => [...current, ...next].slice(-4));
  });

  const dismiss = useCallback(
    (id: string) => setNotices((current) => current.filter((notice) => notice.id !== id)),
    [],
  );
  const clear = useCallback(() => setNotices([]), []);
  return { notices, dismiss, clear };
}
