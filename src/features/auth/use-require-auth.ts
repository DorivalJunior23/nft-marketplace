import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useCallback } from 'react';

import { useCurrentUser } from './session-store';

/**
 * Para ações privadas disparadas de telas públicas (favoritar, comprar): se não houver
 * sessão, leva ao login guardando a rota atual para retornar ao fluxo depois.
 */
export function useRequireAuth() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
        return true;
      }
      void navigate({
        to: '/entrar',
        search: { redirect: `${location.pathname}${location.searchStr}` },
      });
      return false;
    },
    [user, navigate, location.pathname, location.searchStr],
  );

  return { user, requireAuth };
}
