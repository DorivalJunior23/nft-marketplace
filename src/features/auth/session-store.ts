import { useSyncExternalStore } from 'react';

import type { Session, User } from '@/contracts';
import { safeStorage } from '@/lib/storage';

const KEY = 'kurio.session';

export type SessionEndReason = 'logout' | 'expired' | 'switch';

interface SessionState {
  session: Session | null;
  /** Preenchido quando a sessão terminou por expiração, para a UI retomar o contexto. */
  endedReason: SessionEndReason | null;
}

type Listener = () => void;

function readPersisted(): Session | null {
  const raw = safeStorage.get(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.token || Date.parse(parsed.expiresAt) <= Date.now()) {
      safeStorage.remove(KEY);
      return null;
    }
    return parsed;
  } catch {
    safeStorage.remove(KEY);
    return null;
  }
}

let state: SessionState = { session: readPersisted(), endedReason: null };
const listeners = new Set<Listener>();

function setState(next: SessionState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

/**
 * Política de sessão: token opaco guardado no localStorage (recuperável após refresh),
 * enviado como Bearer; 401 em rotas privadas encerra a sessão com motivo "expired".
 */
export const sessionStore = {
  getState: () => state,
  /** Search params do login após uma expiração: a tela mostra o aviso e preserva a rota. */
  loginSearch: (redirect: string) => ({
    redirect,
    motivo: state.endedReason === 'expired' ? ('sessao-expirada' as const) : undefined,
  }),
  getToken: () => state.session?.token ?? null,
  getUser: (): User | null => state.session?.user ?? null,
  isAuthenticated: () => state.session !== null,
  start(session: Session): void {
    safeStorage.set(KEY, JSON.stringify(session));
    setState({ session, endedReason: null });
  },
  updateUser(user: User): void {
    if (!state.session) return;
    const session = { ...state.session, user };
    safeStorage.set(KEY, JSON.stringify(session));
    setState({ session, endedReason: null });
  },
  end(reason: SessionEndReason): void {
    safeStorage.remove(KEY);
    setState({ session: null, endedReason: reason });
  },
  clearEndedReason(): void {
    if (state.endedReason) setState({ ...state, endedReason: null });
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useSessionState(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState, sessionStore.getState);
}

export function useCurrentUser(): User | null {
  return useSessionState().session?.user ?? null;
}
