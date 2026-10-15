import type { EthAmount } from './common';
import type { NftEdition } from './nft';
import type { OrderReceipt, OrderStatus } from './order';

/**
 * Envelope comum dos eventos Socket.IO: identidade estável (eventId), recurso afetado e versão.
 * O cliente descarta eventos cuja versão não seja maior que a conhecida para o recurso.
 */
export interface RealtimeEvent<TType extends string, TResource extends string, TData> {
  eventId: string;
  type: TType;
  resource: { type: TResource; id: string };
  version: number;
  occurredAt: string;
  data: TData;
}

export type NftUpdatedEvent = RealtimeEvent<
  'nft.updated',
  'nft',
  {
    price: EthAmount;
    compareAtPrice: EthAmount | null;
    editions: NftEdition[];
    totalAvailable: number;
  }
>;

export type OrderUpdatedEvent = RealtimeEvent<
  'order.updated',
  'order',
  {
    status: OrderStatus;
    receipt: OrderReceipt;
    declineReason: string | null;
  }
>;

export interface ServerToClientEvents {
  'nft.updated': (event: NftUpdatedEvent) => void;
  'order.updated': (event: OrderUpdatedEvent) => void;
}

/** O cliente não emite eventos: a assinatura é implícita pelo token do handshake. */
export type ClientToServerEvents = Record<never, never>;
