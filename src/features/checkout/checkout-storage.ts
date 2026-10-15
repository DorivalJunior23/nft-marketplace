import type { CollectorFormValues } from './schemas';

const DRAFT_KEY = 'kurio.checkout.draft';
const IDEMPOTENCY_KEY = 'kurio.checkout.idempotency';

export interface CheckoutDraft {
  /** Dono do rascunho: outro usuário na mesma aba nunca o enxerga. */
  userId: string;
  values: Partial<CollectorFormValues>;
  walletId: string | null;
  savedAt: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignorado
  }
}

/**
 * Rascunho do checkout: preserva o contexto se a sessão expirar ou a página recarregar.
 * Fica vinculado ao usuário; um rascunho de outro usuário é descartado na leitura.
 */
export const checkoutDraft = {
  read(userId: string): CheckoutDraft | null {
    const draft = read<CheckoutDraft>(DRAFT_KEY);
    return draft && draft.userId === userId ? draft : null;
  },
  write: (draft: Omit<CheckoutDraft, 'savedAt'>) =>
    write(DRAFT_KEY, { ...draft, savedAt: new Date().toISOString() }),
  clear: () => write(DRAFT_KEY, null),
};

interface IdempotencyRecord {
  userId: string;
  key: string;
  payloadHash: string;
}

/**
 * Chave de idempotência da tentativa atual. Enquanto o conteúdo do pedido for o mesmo, a mesma
 * chave é reutilizada (clique repetido, timeout, refresh); conteúdo novo gera chave nova.
 */
export const idempotencyStore = {
  keyFor(userId: string, payloadHash: string): string {
    const current = read<IdempotencyRecord>(IDEMPOTENCY_KEY);
    if (current && current.userId === userId && current.payloadHash === payloadHash)
      return current.key;
    const key = crypto.randomUUID();
    write(IDEMPOTENCY_KEY, { userId, key, payloadHash } satisfies IdempotencyRecord);
    return key;
  },
  clear: () => write(IDEMPOTENCY_KEY, null),
};

/** Hash estável (FNV-1a) do conteúdo do pedido, usado para decidir se a chave pode ser reaproveitada. */
export function hashPayload(payload: unknown): string {
  const input = JSON.stringify(payload);
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
