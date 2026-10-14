import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts';

export type RealtimeMessage =
  | { event: NftUpdatedEvent; targetUserId: null }
  | { event: OrderUpdatedEvent; targetUserId: string };

type Listener = (message: RealtimeMessage) => void;

const listeners = new Set<Listener>();
let eventSequence = 0;

/** Barramento interno: serviços publicam, o handler do socket entrega aos clientes conectados. */
export const realtimeBus = {
  publish(message: RealtimeMessage): void {
    listeners.forEach((listener) => listener(message));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  nextEventId(prefix: string): string {
    eventSequence += 1;
    return `${prefix}_${Date.now().toString(36)}_${eventSequence}`;
  },
};
