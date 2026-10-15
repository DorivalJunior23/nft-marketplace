import { redirect } from '@tanstack/react-router';

import { sessionStore } from './session-store';

/** Rotas privadas: sem sessão, redireciona ao login guardando a rota para retomar o fluxo. */
export function requireSession({ location }: { location: { href: string } }): void {
  if (!sessionStore.isAuthenticated()) {
    throw redirect({ to: '/entrar', search: { redirect: location.href } });
  }
}

export const PRIVATE_PREFIXES = ['/perfil', '/carteiras', '/pedidos', '/favoritos', '/pagamento'];

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
