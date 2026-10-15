import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from '@/lib/toast';

import type { Nft, NftEdition } from '@/contracts';
import { useAddToCart } from '@/features/cart/mutations';

/** Estado compartilhado entre as versões desktop e mobile da tela de detalhes. */
export function usePurchaseForm(nft: Nft) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const firstAvailable =
    nft.editions.find((edition) => edition.status === 'available') ?? nft.editions[0];
  const [editionId, setEditionId] = useState<NftEdition['id']>(firstAvailable?.id ?? '1-1');
  const [quantity, setQuantity] = useState(1);

  const edition = nft.editions.find((item) => item.id === editionId) ?? firstAvailable;
  const maxQuantity = edition ? Math.max(1, Math.min(edition.maxPerOrder, edition.available)) : 1;
  const safeQuantity = Math.min(quantity, maxQuantity);
  const canBuy = Boolean(edition && edition.status === 'available' && edition.available > 0);

  const selectEdition = (id: NftEdition['id']) => {
    setEditionId(id);
    setQuantity(1);
  };

  const buy = () => {
    if (!edition || !canBuy) return;
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: safeQuantity },
      {
        onSuccess: () => {
          toast.success(`${nft.name} adicionado ao carrinho.`, {
            action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/carrinho' }) },
          });
        },
      },
    );
  };

  return {
    edition,
    editionId,
    selectEdition,
    quantity: safeQuantity,
    setQuantity: (value: number) => setQuantity(Math.max(1, Math.min(value, maxQuantity))),
    maxQuantity,
    canBuy,
    buy,
    isBuying: addToCart.isPending,
  };
}
