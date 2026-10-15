import { useRouterState } from '@tanstack/react-router';
import { useRef, useState, type ReactNode } from 'react';

import { Container } from '@/components/common/container';
import { Toaster } from '@/components/ui/sonner';
import { SessionSync } from '@/features/auth/session-sync';
import { useLogout } from '@/features/auth/use-logout';
import { useCartCount } from '@/features/cart/queries';
import { useIsDesktop } from '@/hooks/use-media-query';
import { ScenarioPanel } from '@/mocks/panel/scenario-panel';

import { SearchDialog } from './search-dialog';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** Rotas cujo cabeçalho desktop leva a linha divisória, como nos frames do Figma. */
const DIVIDER_ROUTES = new Set(['/', '/entrar', '/cadastro', '/perfil', '/carteiras']);

interface AppShellProps {
  children: ReactNode;
}

/**
 * Casca da aplicação. No desktop (>= 768px) segue o frame de 1440px: padding 24px no topo,
 * cabeçalho, conteúdo e rodapé com 96px entre seções. No mobile cada tela traz seu próprio topo.
 */
export function AppShell({ children }: AppShellProps) {
  const isDesktop = useIsDesktop();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cartCount = useCartCount();
  const logout = useLogout();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="bg-primary text-ink sr-only z-50 rounded-[6px] px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo principal
      </a>

      {isDesktop ? (
        <Container className="pt-6">
          <SiteHeader
            divider={DIVIDER_ROUTES.has(pathname)}
            cartCount={cartCount}
            onOpenSearch={() => setSearchOpen(true)}
            searchTriggerRef={searchTriggerRef}
            onLogout={() => logout.mutate()}
          />
        </Container>
      ) : null}

      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      {isDesktop ? (
        <Container className="pt-24 pb-6">
          <SiteFooter />
        </Container>
      ) : null}

      <SessionSync />
      <ScenarioPanel />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} triggerRef={searchTriggerRef} />
      <Toaster position={isDesktop ? 'bottom-right' : 'top-center'} closeButton />
    </div>
  );
}
