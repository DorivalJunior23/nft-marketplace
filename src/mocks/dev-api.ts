import type { EditionId, Order } from '@/contracts';

import { getDb, resetDb } from './db/store';
import { resetConsumedFlags, getScenario, setScenario } from './runtime';
import { SCENARIOS, type MockScenario } from './scenarios';
import { expireAllSessions } from './services/auth';
import {
  increaseNftPrice,
  republishNft,
  setEditionAvailability,
  updateNftPrice,
} from './services/catalog';
import { listOrders, republishOrder, settleOrder } from './services/orders';
import { dropSocketConnections, socketConnectionCount } from './socket';

/**
 * API de controle da simulação, exposta em `window.__kurio.mocks` para o painel de
 * desenvolvimento e para os testes Playwright. Tudo passa pelos serviços dos mocks;
 * os eventos resultantes chegam ao cliente pelo socket.io-client real.
 */
export interface KurioMocksApi {
  scenario: {
    get: () => MockScenario;
    set: (id: string) => MockScenario;
    list: () => readonly MockScenario[];
  };
  reset: () => Promise<void>;
  nft: {
    setPrice: (id: string, price: string) => void;
    increasePrice: (id: string, factor?: number) => void;
    setAvailability: (id: string, editionId: EditionId, available: number) => void;
    republish: (id: string) => void;
  };
  orders: {
    settle: (orderId: string, outcome: 'confirmed' | 'declined') => Order | null;
    republish: (orderId: string, options?: { stale?: boolean }) => void;
    listForUser: (userId: string) => Order[];
  };
  session: { expireAll: () => void };
  socket: { dropConnections: () => number; connectionCount: () => number };
  db: { snapshot: () => unknown };
}

declare global {
  interface Window {
    __kurio?: { mocks: KurioMocksApi };
  }
}

export function installDevApi(): KurioMocksApi {
  const api: KurioMocksApi = {
    scenario: { get: getScenario, set: setScenario, list: () => SCENARIOS },
    reset: async () => {
      await resetDb();
      resetConsumedFlags();
    },
    nft: {
      setPrice: (id, price) => void updateNftPrice(id, price),
      increasePrice: (id, factor) => void increaseNftPrice(id, factor),
      setAvailability: (id, editionId, available) =>
        void setEditionAvailability(id, editionId, available),
      republish: (id) => void republishNft(id),
    },
    orders: { settle: settleOrder, republish: republishOrder, listForUser: listOrders },
    session: { expireAll: expireAllSessions },
    socket: { dropConnections: dropSocketConnections, connectionCount: socketConnectionCount },
    db: { snapshot: () => structuredClone(getDb()) },
  };
  window.__kurio = { mocks: api };
  return api;
}
