import { Link, useRouterState } from '@tanstack/react-router';
import type { RefObject } from 'react';

import { CartIcon, LogoutIcon, SearchIcon, UserIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/session-store';
import { cn } from '@/lib/utils';

import { BrandLogo } from './brand-logo';

const NAV_ITEMS: ReadonlyArray<{ label: string; to: string; match: (path: string) => boolean }> = [
  { label: 'Início', to: '/', match: (path) => path === '/' },
  {
    label: 'Mercado',
    to: '/mercado',
    match: (path) =>
      path.startsWith('/mercado') ||
      path.startsWith('/nft') ||
      path.startsWith('/carrinho') ||
      path.startsWith('/pagamento'),
  },
  { label: 'Criadores', to: '/criadores', match: (path) => path.startsWith('/criadores') },
  { label: 'Aprenda', to: '/aprenda', match: (path) => path.startsWith('/aprenda') },
];

interface SiteHeaderProps {
  /** Linha divisória laranja a 30% abaixo do cabeçalho (Início, Login, Cadastro, Perfil e Carteiras). */
  divider?: boolean;
  cartCount: number;
  onOpenSearch: () => void;
  searchTriggerRef?: RefObject<HTMLButtonElement | null>;
  onLogout: () => void;
}

/** Cabeçalho desktop do Figma: 1200px, logo, navegação com sublinhado ativo e ações. */
export function SiteHeader({
  divider = false,
  cartCount,
  onOpenSearch,
  searchTriggerRef,
  onLogout,
}: SiteHeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const user = useCurrentUser();

  return (
    <header className={cn('relative', divider && 'border-primary/30 border-b')}>
      <div className="flex h-[45px] items-center justify-between">
        <BrandLogo className="w-40" />

        <nav
          aria-label="Navegação principal"
          className="mr-auto ml-[216px] flex h-full items-start gap-10"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-cream hover:text-text-accent relative flex h-full items-start text-[16px] leading-[21px] transition-colors',
                  active && 'text-text-accent font-bold',
                )}
              >
                {item.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="bg-primary absolute inset-x-0 -bottom-px h-[3px]"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex h-[35px] items-center gap-7">
          <button
            ref={searchTriggerRef}
            type="button"
            onClick={onOpenSearch}
            className="text-cream hover:text-text-accent focus-visible:ring-ring focus-visible:ring-offset-background flex size-9 items-center justify-center rounded-[6px] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="Buscar NFTs"
          >
            <SearchIcon className="size-5" />
          </button>

          <Link
            to="/carrinho"
            className="text-cream hover:text-text-accent focus-visible:ring-ring focus-visible:ring-offset-background relative flex size-9 items-center justify-center rounded-[6px] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={`Carrinho de NFTs, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
          >
            <CartIcon className="h-6 w-[25px]" />
            {cartCount > 0 ? (
              <span
                aria-hidden="true"
                data-testid="cart-badge"
                className="border-ink bg-primary text-ink absolute top-0 right-0 flex size-4 items-center justify-center rounded-full border-2 text-[10px] leading-[13px] font-medium"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="compact"
                  className="max-w-[200px] gap-2 pr-3 pl-1.5"
                  aria-label={`Conta de ${user.displayName}`}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
                  ) : (
                    <span className="bg-ink/15 flex size-6 items-center justify-center rounded-full">
                      <UserIcon className="size-4" />
                    </span>
                  )}
                  <span className="truncate">{user.displayName.split(' ')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuItem asChild>
                  <Link to="/perfil">Dados do perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/carteiras">Carteiras</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pedidos">Meus pedidos</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout}>
                  <LogoutIcon className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="compact" className="w-[100px]">
              <Link to="/entrar" search={{ redirect: pathname === '/' ? undefined : pathname }}>
                <LogoutIcon className="size-5" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
