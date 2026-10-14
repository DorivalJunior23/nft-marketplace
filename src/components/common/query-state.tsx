import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/error-message';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
}

/** Estado de erro com nova tentativa; a mensagem vem do erro normalizado da API. */
export function ErrorState({
  error,
  onRetry,
  title = 'Algo deu errado',
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`border-error/40 bg-surface-card flex flex-col items-center justify-center gap-3 rounded-[8px] border text-center ${compact ? 'p-4' : 'p-10'}`}
    >
      <p className="text-coral text-[16px] leading-5 font-bold">{title}</p>
      <p className="text-text-secondary max-w-[420px] text-[14px] leading-6">
        {errorMessage(error)}
      </p>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="bg-surface-card flex flex-col items-center justify-center gap-3 rounded-[8px] p-10 text-center"
    >
      <p className="text-cream text-[18px] leading-6 font-bold">{title}</p>
      {description ? (
        <p className="text-text-secondary max-w-[420px] text-[14px] leading-6">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
