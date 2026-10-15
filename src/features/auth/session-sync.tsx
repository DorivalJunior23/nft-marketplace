import { useQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from '@/lib/toast';

import { authApi } from '@/api';

import { isPrivatePath } from './route-guard';
import { sessionStore, useSessionState } from './session-store';

/**
 * Mantém a sessão coerente com a API: valida o token persistido ao abrir a aplicação e,
 * quando a sessão expira (401 numa rota privada), avisa e leva ao login preservando a rota.
 */
export function SessionSync() {
  const { session, endedReason } = useSessionState();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });

  const check = useQuery({
    queryKey: ['session', session?.token ?? 'none'],
    queryFn: authApi.session,
    enabled: Boolean(session),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (check.data) sessionStore.updateUser(check.data.user);
  }, [check.data]);

  useEffect(() => {
    if (endedReason !== 'expired') return;
    if (isPrivatePath(location.pathname)) {
      // O aviso fica na própria tela de login (via URL), que preserva a rota de origem.
      void navigate({
        to: '/entrar',
        search: { redirect: location.href, motivo: 'sessao-expirada' },
      });
    } else {
      toast.warning('Sua sessão expirou. Entre novamente para continuar de onde parou.');
    }
    sessionStore.clearEndedReason();
  }, [endedReason, location.pathname, location.href, navigate]);

  return null;
}
