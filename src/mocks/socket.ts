import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws, type WebSocketHandler } from 'msw';

import { getDb } from './db/store';
import { realtimeBus } from './realtime-bus';

/**
 * Transporte: o socket.io-client conecta só por WebSocket (`transports: ['websocket']`),
 * interceptado pelo MSW. A binding faz o handshake do Engine.IO, mas não envia pings,
 * então este handler mantém o heartbeat para o cliente não encerrar por timeout.
 */
const HEARTBEAT_MS = 20_000;

interface LiveConnection {
  userId: string | null;
  close: () => void;
}

const connections = new Set<LiveConnection>();

function resolveUserId(token: unknown): string | null {
  if (typeof token !== 'string') return null;
  const session = getDb().sessions[token];
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  return session.userId;
}

function createLink(url: string | RegExp): WebSocketHandler {
  const link = ws.link(url);
  return link.addEventListener('connection', (connection) => {
    const { client } = connection;
    const io = toSocketIo(connection);
    const live: LiveConnection = { userId: null, close: () => client.close() };

    client.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      // Pacote CONNECT do Socket.IO ("40" + JSON opcional com o `auth` do cliente).
      if (event.data.startsWith('40')) {
        try {
          const payload =
            event.data.length > 2 ? (JSON.parse(event.data.slice(2)) as { token?: unknown }) : {};
          live.userId = resolveUserId(payload.token);
        } catch {
          live.userId = null;
        }
      }
    });

    const heartbeat = window.setInterval(() => client.send('2'), HEARTBEAT_MS);

    const unsubscribe = realtimeBus.subscribe(({ event, targetUserId }) => {
      // Eventos de pedido só chegam ao dono; eventos de catálogo são broadcast.
      if (targetUserId && targetUserId !== live.userId) return;
      io.client.emit(event.type, event);
    });

    connections.add(live);
    client.addEventListener('close', () => {
      window.clearInterval(heartbeat);
      unsubscribe();
      connections.delete(live);
    });
  });
}

// O MSW remove o prefixo "/socket.io/" da URL do cliente antes de casar o padrão,
// então o link casa a raiz de qualquer origem (dev, preview e produção).
export const socketHandlers = [createLink(/^wss?:\/\/[^/]+\/?$/)];

/** Derruba todas as conexões ativas para simular queda de rede no socket. */
export function dropSocketConnections(): number {
  const count = connections.size;
  for (const live of [...connections]) live.close();
  return count;
}

export function socketConnectionCount(): number {
  return connections.size;
}
