import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from '@/contracts';
import { sessionStore } from '@/features/auth/session-store';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? '/';

let socket: AppSocket | null = null;

/**
 * Cliente Socket.IO único da aplicação. Conecta apenas por WebSocket (o MSW não intercepta
 * long-polling) e envia o token da sessão no handshake, para que o servidor filtre eventos
 * privados por usuário.
 */
export function getSocket(): AppSocket {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    path: '/socket.io/',
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    auth: (cb) => cb({ token: sessionStore.getToken() }),
  });
  return socket;
}

/** Reinicia a conexão com as credenciais atuais (login, logout ou troca de usuário). */
export function reconnectSocket(): void {
  const current = getSocket();
  if (current.connected) current.disconnect();
  current.connect();
}
