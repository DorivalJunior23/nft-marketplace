import { createContext } from 'react';

import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export type NftListener = (
  event: NftUpdatedEvent,
  previous: { price: string; totalAvailable: number } | null,
) => void;
export type OrderListener = (event: OrderUpdatedEvent) => void;

export interface RealtimeContextValue {
  status: RealtimeStatus;
  /** Último recurso atualizado, para feedback acessível. */
  lastAnnouncement: string;
  onNftUpdated: (listener: NftListener) => () => void;
  onOrderUpdated: (listener: OrderListener) => () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);
