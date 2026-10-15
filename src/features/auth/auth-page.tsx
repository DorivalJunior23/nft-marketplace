import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { CloseIcon } from '@/components/icons';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { HomePage } from '@/features/home/home-page';
import { useIsDesktop } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

import { AuthSwitchLink, LoginForm, RegisterForm, SocialBlock } from './auth-forms';
import { sessionStore, useCurrentUser } from './session-store';

interface AuthPageProps {
  mode: 'login' | 'register';
  redirect?: string;
  /** Chegou aqui porque a sessão expirou numa rota privada (`?motivo=sessao-expirada`). */
  sessionExpired?: boolean;
}

const COPY = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar conta',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
} as const;

/** Destino após autenticar: a rota de origem (quando segura) ou o início. */
function SessionExpiredNotice() {
  return (
    <p
      role="status"
      className="border-primary/40 bg-primary/10 text-cream rounded-[6px] border px-4 py-3 text-[13px] leading-5"
    >
      Sua sessão expirou. Entre novamente para continuar de onde parou.
    </p>
  );
}

function safeRedirect(redirect?: string): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return '/';
  if (redirect.startsWith('/entrar') || redirect.startsWith('/cadastro')) return '/';
  return redirect;
}

/**
 * Login e cadastro. No desktop, o Figma mostra um modal sobre a Início; no mobile, uma tela própria.
 * Em ambos a rota é real (`/entrar`, `/cadastro`), então refresh e acesso direto funcionam.
 */
export function AuthPage({ mode, redirect, sessionExpired = false }: AuthPageProps) {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const target = safeRedirect(redirect);

  useEffect(() => {
    if (user) void navigate({ to: target, replace: true });
  }, [user, navigate, target]);

  const finish = () => {
    sessionStore.clearEndedReason();
    void navigate({ to: target, replace: true });
  };

  if (!isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col gap-10 px-7 pt-20 pb-6">
        <p className="text-cream flex h-[136px] items-center justify-center text-[32px] leading-[42px] font-bold tracking-[3.2px]">
          KURIO
        </p>
        <h1
          className={cn(
            'text-cream text-center leading-4 font-bold',
            mode === 'login' ? 'text-[20px]' : 'text-[18px]',
          )}
        >
          {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
        </h1>
        {sessionExpired ? <SessionExpiredNotice /> : null}
        {mode === 'login' ? (
          <LoginForm variant="mobile" onSuccess={finish} />
        ) : (
          <RegisterForm variant="mobile" onSuccess={finish} />
        )}
        <SocialBlock variant="mobile" />
        <div className="mt-auto">
          <AuthSwitchLink mode={mode} redirect={redirect} />
        </div>
      </div>
    );
  }

  return (
    <>
      <HomePage search={{}} />
      <Dialog open onOpenChange={(open) => (open ? undefined : void navigate({ to: '/' }))}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'bg-surface-card text-cream shadow-float flex w-[500px] max-w-[500px] flex-col gap-0 overflow-hidden rounded-[8px] border-0 p-0',
            mode === 'login' ? 'min-h-[600px]' : 'min-h-[656px]',
          )}
        >
          <div className="flex flex-col items-center gap-10 px-12 pt-12">
            <div className="flex items-center gap-2 text-[20px] leading-4 font-medium">
              <Link
                to="/entrar"
                search={{ redirect }}
                className={cn(
                  'focus-visible:ring-ring rounded-[4px] px-1 focus-visible:ring-2 focus-visible:outline-none',
                  mode === 'login' ? 'text-text-accent' : 'text-cream hover:text-text-accent',
                )}
                aria-current={mode === 'login' ? 'page' : undefined}
              >
                Entrar
              </Link>
              <span aria-hidden="true" className="bg-coral h-5 w-px" />
              <Link
                to="/cadastro"
                search={{ redirect }}
                className={cn(
                  'focus-visible:ring-ring rounded-[4px] px-1 focus-visible:ring-2 focus-visible:outline-none',
                  mode === 'register' ? 'text-text-accent' : 'text-cream hover:text-text-accent',
                )}
                aria-current={mode === 'register' ? 'page' : undefined}
              >
                Criar conta
              </Link>
            </div>
            <DialogTitle className="sr-only">{COPY[mode].title}</DialogTitle>
            <DialogDescription className="text-cream text-center text-[13px] leading-4">
              {COPY[mode].description}
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-4 px-20 pt-6">
            {sessionExpired ? <SessionExpiredNotice /> : null}
            {mode === 'login' ? (
              <LoginForm variant="modal" onSuccess={finish} />
            ) : (
              <RegisterForm variant="modal" onSuccess={finish} />
            )}
          </div>
          <div className="px-20 pb-8">
            <SocialBlock variant="modal" />
          </div>
          <div className="bg-primary mt-auto h-2.5 w-full" aria-hidden="true" />
          <Link
            to="/"
            aria-label="Fechar"
            className="text-primary hover:text-primary-light focus-visible:ring-ring absolute top-[11px] right-3 flex size-[18px] items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
          >
            <CloseIcon className="size-[18px]" />
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
