import { Link, useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';

import { HeartOutlineIcon, HomeIcon, ShopIcon, UserIcon } from '@/components/icons';
import { useCartCount } from '@/features/cart/queries';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/', label: 'Início', Icon: HomeIcon, match: (p: string) => p === '/' },
  {
    to: '/favoritos',
    label: 'Lista de interesse',
    Icon: HeartOutlineIcon,
    match: (p: string) => p.startsWith('/favoritos'),
  },
  {
    to: '/carrinho',
    label: 'Carrinho',
    Icon: ShopIcon,
    match: (p: string) => p.startsWith('/carrinho'),
  },
  {
    to: '/perfil',
    label: 'Perfil',
    Icon: UserIcon,
    match: (p: string) => p.startsWith('/perfil') || p.startsWith('/carteiras'),
  },
] as const;

/** Barra inferior do Figma mobile: fundo Surface Card com recorte central e botão circular laranja. */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cartCount = useCartCount();
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 h-[126px]">
      <div
        aria-hidden="true"
        className="bg-surface-card absolute inset-x-0 bottom-0 h-[95px] [mask-image:radial-gradient(circle_40px_at_50%_0,transparent_39px,#000_40px)] shadow-[0_-10px_30px_rgb(10_6_4/0.45)]"
      />
      <button
        type="button"
        onClick={() => toast.info('A criação de NFTs não está disponível nesta demonstração.')}
        aria-label="Criar NFT (indisponível)"
        className="text-cream focus-visible:ring-ring absolute top-0 left-1/2 flex size-[65px] -translate-x-1/2 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgb(210_138_76/0.4),#D28A4C)] focus-visible:ring-2 focus-visible:outline-none"
      >
        <svg aria-hidden="true" viewBox="0 0 27 24" className="h-6 w-[27px]" fill="currentColor">
          <rect x="1" y="0" width="10" height="10" rx="2" />
          <rect x="15" y="0" width="10" height="10" rx="2" />
          <rect x="1" y="14" width="10" height="10" rx="2" />
          <rect x="15" y="14" width="10" height="10" rx="2" />
          <rect x="0" y="11" width="27" height="2" />
        </svg>
      </button>
      <ul className="absolute inset-x-0 bottom-0 flex h-[95px] items-start justify-between px-9 pt-10">
        {ITEMS.map(({ to, label, Icon, match }, index) => {
          const active = match(pathname);
          return (
            <li
              key={to}
              className={cn(index === 1 && 'mr-auto ml-[52px]', index === 2 && 'mr-[42px] ml-auto')}
            >
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex size-11 items-center justify-center rounded-full',
                  active ? 'text-text-accent' : 'text-text-secondary',
                )}
              >
                <Icon className="size-5" />
                {to === '/carrinho' && cartCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="border-surface-card bg-primary text-ink absolute top-1 right-1 flex size-4 items-center justify-center rounded-full border-2 text-[10px] font-medium"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
