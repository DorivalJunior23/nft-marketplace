import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Container } from '@/components/common/container';
import {
  ActivityIcon,
  ArrowLeftIcon,
  BagIcon,
  DangerTriangleIcon,
  DownloadIcon,
  HeartIcon,
  LocationIcon,
  LogoutIcon,
  UserIcon,
} from '@/components/icons';
import { useLogout } from '@/features/auth/use-logout';
import { useIsDesktop } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/perfil', label: 'Dados do perfil', Icon: UserIcon, size: 'size-[18px]' },
  { to: '/carteiras', label: 'Carteiras', Icon: LocationIcon, size: 'size-5' },
  { to: '/pedidos', label: 'Atividade', Icon: BagIcon, size: 'size-[18px]' },
  { to: '/favoritos', label: 'Lista de interesse', Icon: HeartIcon, size: 'size-4' },
  { to: '/em-breve', label: 'Ofertas', Icon: ActivityIcon, size: 'size-[18px]' },
  { to: '/em-breve', label: 'Arquivos baixados', Icon: DownloadIcon, size: 'size-[18px]' },
  { to: '/em-breve', label: 'Suporte', Icon: DangerTriangleIcon, size: 'size-[18px]' },
] as const;

interface AccountLayoutProps {
  title: string;
  children: ReactNode;
}

/**
 * Área da conta (Figma: Perfil e Carteiras): sidebar 310px em Surface Card com item ativo
 * marcado por barra laranja de 6px à esquerda. No mobile vira cabeçalho com voltar + abas roláveis.
 */
export function AccountLayout({ title, children }: AccountLayoutProps) {
  const isDesktop = useIsDesktop();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const logout = useLogout();
  const router = useRouter();

  if (!isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col gap-6 px-6 pt-6 pb-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="border-border bg-surface-raised text-text-secondary focus-visible:ring-ring flex size-[35px] items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Voltar"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
          <h1 className="text-cream text-[18px] leading-5 font-bold">{title}</h1>
        </div>
        <nav aria-label="Seções da conta" className="-mx-6 overflow-x-auto px-6">
          <ul className="flex gap-2">
            {ITEMS.map((item) => {
              const active = pathname.startsWith(item.to) && item.to !== '/em-breve';
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] whitespace-nowrap',
                      active
                        ? 'border-primary bg-primary/15 text-text-accent'
                        : 'border-border text-text-secondary',
                    )}
                  >
                    <item.Icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {children}
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="text-text-accent focus-visible:ring-ring flex items-center gap-2 self-start text-[15px] leading-4 font-bold focus-visible:ring-2 focus-visible:outline-none"
        >
          <LogoutIcon className="text-primary size-5" />
          Sair
        </button>
      </div>
    );
  }

  return (
    <Container className="flex gap-7 pt-8">
      <aside
        className="bg-surface-card h-fit w-[240px] shrink-0 py-2 lg:w-[260px] xl:w-[310px]"
        aria-label="Menu da conta"
      >
        <p className="text-cream px-2.5 py-2.5 text-[18px] leading-4 font-bold">Meu perfil</p>
        <nav aria-label="Seções da conta">
          <ul>
            {ITEMS.map((item) => {
              const active = pathname.startsWith(item.to) && item.to !== '/em-breve';
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'text-text-accent hover:bg-surface-raised focus-visible:ring-ring flex h-[45px] items-center gap-3 border-l-[6px] px-4 text-[15px] leading-[45px] transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                      active ? 'border-primary' : 'border-transparent',
                    )}
                  >
                    <item.Icon
                      className={cn(item.size, active ? 'text-primary' : 'text-brand-secondary')}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-primary/30 mt-0 border-t">
          <button
            type="button"
            onClick={() => logout.mutate()}
            aria-busy={logout.isPending || undefined}
            className="text-text-accent hover:bg-surface-raised focus-visible:ring-ring flex h-10 w-full items-center gap-2 px-4 text-[15px] leading-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
            data-testid="logout-button"
          >
            <LogoutIcon className="text-primary size-5" />
            Sair
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-8">{children}</div>
    </Container>
  );
}
