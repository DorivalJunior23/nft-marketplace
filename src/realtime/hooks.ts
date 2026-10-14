import { useContext, useEffect, useRef } from 'react';

import {
  RealtimeContext,
  type NftListener,
  type OrderListener,
  type RealtimeContextValue,
} from './realtime-context';

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime precisa ser usado dentro de <RealtimeProvider>.');
  return context;
}

/** Assina nft.updated enquanto o componente existir; o listener é liberado no unmount. */
export function useNftUpdates(listener: NftListener): void {
  const { onNftUpdated } = useRealtime();
  const ref = useRef(listener);
  useEffect(() => {
    ref.current = listener;
  });
  useEffect(() => onNftUpdated((event, previous) => ref.current(event, previous)), [onNftUpdated]);
}

export function useOrderUpdates(listener: OrderListener): void {
  const { onOrderUpdated } = useRealtime();
  const ref = useRef(listener);
  useEffect(() => {
    ref.current = listener;
  });
  useEffect(() => onOrderUpdated((event) => ref.current(event)), [onOrderUpdated]);
}
