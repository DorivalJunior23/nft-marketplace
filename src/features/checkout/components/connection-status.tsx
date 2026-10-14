import { cn } from '@/lib/utils';

import type { ConnectionState } from '../use-checkout';

const LABEL: Record<ConnectionState['status'], string> = {
  idle: 'Carteira desconectada',
  connecting: 'Conectando à carteira…',
  connected: 'Carteira conectada',
  rejected: 'Conexão recusada',
  error: 'Falha na conexão',
};

/** Estado da conexão simulada da carteira, com texto e marcador (não depende só da cor). */
export function ConnectionStatus({
  connection,
  onDisconnect,
  className,
}: {
  connection: ConnectionState;
  onDisconnect?: () => void;
  className?: string;
}) {
  const tone =
    connection.status === 'connected'
      ? 'text-success'
      : connection.status === 'rejected' || connection.status === 'error'
        ? 'text-coral'
        : 'text-text-secondary';
  return (
    <div
      className={cn('flex flex-col gap-1 text-[13px] leading-4', className)}
      role="status"
      aria-live="polite"
      data-testid="connection-status"
    >
      <p className={cn('flex items-center gap-2', tone)}>
        <span
          aria-hidden="true"
          className={cn(
            'size-2 rounded-full',
            connection.status === 'connected'
              ? 'bg-success'
              : connection.status === 'connecting'
                ? 'bg-amber animate-pulse'
                : connection.status === 'idle'
                  ? 'bg-border-soft'
                  : 'bg-error',
          )}
        />
        {LABEL[connection.status]}
        {connection.status === 'connected' && onDisconnect ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="text-text-accent focus-visible:ring-ring ml-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Desconectar
          </button>
        ) : null}
      </p>
      {'message' in connection && connection.message ? (
        <p className="text-coral">{connection.message}</p>
      ) : null}
    </div>
  );
}
