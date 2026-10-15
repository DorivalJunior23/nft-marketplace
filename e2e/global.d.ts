import type { KurioMocksApi } from '../src/mocks/dev-api';

declare global {
  interface Window {
    __kurio?: { mocks: KurioMocksApi };
  }
}

export {};
