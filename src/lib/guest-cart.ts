import { safeStorage } from './storage';

const KEY = 'kurio.guest-cart';

/** Identificador anônimo do carrinho do visitante, enviado no header X-Guest-Cart. */
export const guestCart = {
  getId(): string {
    let id = safeStorage.get(KEY);
    if (!id) {
      id = crypto.randomUUID();
      safeStorage.set(KEY, id);
    }
    return id;
  },
  peekId(): string | null {
    return safeStorage.get(KEY);
  },
  rotate(): string {
    const id = crypto.randomUUID();
    safeStorage.set(KEY, id);
    return id;
  },
};
