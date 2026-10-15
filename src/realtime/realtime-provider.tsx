import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type {
  Cart,
  Nft,
  NftListResponse,
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
} from '@/contracts';
import { cartKeys } from '@/features/cart/queries';
import { catalogKeys } from '@/features/catalog/queries';
import { mulEth } from '@/lib/money';
import { useSessionState } from '@/features/auth/session-store';

import {
  RealtimeContext,
  type NftListener,
  type OrderListener,
  type RealtimeContextValue,
  type RealtimeStatus,
} from './realtime-context';
import { getSocket } from './socket';

const SEEN_LIMIT = 500;

/**
 * Aplica um nft.updated ao cache: detalhe, todas as listagens e todos os carrinhos.
 * Só avança se a versão recebida for maior que a conhecida (nunca regride).
 */
function applyNftUpdate(
  queryClient: QueryClient,
  event: NftUpdatedEvent,
): { price: string; totalAvailable: number } | null {
  const id = event.resource.id;
  const { price, compareAtPrice, editions, totalAvailable } = event.data;
  let previous: { price: string; totalAvailable: number } | null = null;

  queryClient.setQueriesData<Nft>({ queryKey: catalogKeys.detail(id) }, (current) => {
    if (!current || current.version >= event.version) return current;
    previous = { price: current.price, totalAvailable: current.totalAvailable };
    return { ...current, price, compareAtPrice, editions, totalAvailable, version: event.version };
  });

  queryClient.setQueriesData<NftListResponse>({ queryKey: catalogKeys.lists() }, (current) => {
    if (!current || !current.items.some((item) => item.id === id && item.version < event.version))
      return current;
    return {
      ...current,
      items: current.items.map((item) =>
        item.id === id
          ? { ...item, price, compareAtPrice, totalAvailable, version: event.version }
          : item,
      ),
    };
  });

  queryClient.setQueriesData<Cart>({ queryKey: cartKeys.all }, (current) => {
    if (
      !current ||
      !current.items.some((item) => item.nftId === id && item.nft.version < event.version)
    )
      return current;
    const items = current.items.map((item) => {
      if (item.nftId !== id) return item;
      previous ??= { price: item.unitPrice, totalAvailable: item.nft.totalAvailable };
      const edition = editions.find((candidate) => candidate.id === item.editionId) ?? item.edition;
      return {
        ...item,
        nft: { ...item.nft, price, compareAtPrice, totalAvailable, version: event.version },
        edition,
        unitPrice: price,
        lineTotal: mulEth(price, item.quantity),
      };
    });
    return { ...current, items };
  });

  return previous;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { session } = useSessionState();
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [lastAnnouncement, setLastAnnouncement] = useState('');
  const versions = useRef(new Map<string, number>());
  const seen = useRef<string[]>([]);
  const nftListeners = useRef(new Set<NftListener>());
  const orderListeners = useRef(new Set<OrderListener>());
  const hadConnection = useRef(false);
  const userId = session?.user.id ?? null;

  const isFresh = useCallback((key: string, eventId: string, version: number): boolean => {
    if (seen.current.includes(eventId)) return false;
    seen.current.push(eventId);
    if (seen.current.length > SEEN_LIMIT) seen.current.shift();
    const known = versions.current.get(key) ?? -1;
    if (version <= known) return false;
    versions.current.set(key, version);
    return true;
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setStatus('connected');
      if (hadConnection.current) {
        // Reconexão: eventos podem ter sido perdidos, então reconcilia tudo que está ativo com o REST.
        void queryClient.invalidateQueries({ refetchType: 'active' });
        setLastAnnouncement('Conexão em tempo real restabelecida. Dados atualizados.');
      }
      hadConnection.current = true;
    };
    const handleDisconnect = () => {
      setStatus('disconnected');
      setLastAnnouncement('Conexão em tempo real perdida. Tentando reconectar.');
    };
    const handleNft = (event: NftUpdatedEvent) => {
      if (!isFresh(`nft:${event.resource.id}`, event.eventId, event.version)) return;
      const previous = applyNftUpdate(queryClient, event);
      void queryClient.invalidateQueries({ queryKey: ['quote'] });
      nftListeners.current.forEach((listener) => listener(event, previous));
    };
    const handleOrder = (event: OrderUpdatedEvent) => {
      if (!isFresh(`order:${event.resource.id}`, event.eventId, event.version)) return;
      queryClient.setQueriesData<Order>(
        { queryKey: ['orders', 'detail', event.resource.id] },
        (current) => {
          if (!current || current.version >= event.version) return current;
          return {
            ...current,
            status: event.data.status,
            receipt: event.data.receipt,
            declineReason: event.data.declineReason,
            version: event.version,
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      if (event.data.status === 'confirmed')
        void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      setLastAnnouncement(
        event.data.status === 'confirmed'
          ? 'Pedido confirmado na rede.'
          : event.data.status === 'declined'
            ? 'Pedido recusado pela rede.'
            : 'Pedido atualizado.',
      );
      orderListeners.current.forEach((listener) => listener(event));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('nft.updated', handleNft);
    socket.on('order.updated', handleOrder);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('nft.updated', handleNft);
      socket.off('order.updated', handleOrder);
    };
  }, [queryClient, isFresh, userId]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      status,
      lastAnnouncement,
      onNftUpdated: (listener) => {
        nftListeners.current.add(listener);
        return () => nftListeners.current.delete(listener);
      },
      onOrderUpdated: (listener) => {
        orderListeners.current.add(listener);
        return () => orderListeners.current.delete(listener);
      },
    }),
    [status, lastAnnouncement],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      <p className="sr-only" role="status" aria-live="polite">
        {lastAnnouncement}
      </p>
    </RealtimeContext.Provider>
  );
}
