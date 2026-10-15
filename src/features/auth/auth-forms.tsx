import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/lib/toast';

import { PasswordField, TextField, type FieldVariant } from '@/components/forms/field';
import { FacebookIcon } from '@/components/icons';
import { applyApiErrors } from '@/lib/form-errors';
import { cn } from '@/lib/utils';

import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './schemas';
import { useLogin, useRegister } from './use-session-mutations';

interface AuthFormProps {
  variant: Extract<FieldVariant, 'modal' | 'mobile'>;
  onSuccess: () => void;
}

const submitClass: Record<AuthFormProps['variant'], string> = {
  modal: 'h-[45px] rounded-[5px] text-[16px] font-bold',
  mobile: 'h-[60px] rounded-[10px] text-[16px] font-bold',
};

function SubmitButton({
  variant,
  children,
  busy,
}: {
  variant: AuthFormProps['variant'];
  children: string;
  busy: boolean;
}) {
  return (
    <button
      type="submit"
      aria-busy={busy || undefined}
      disabled={busy}
      className={cn(
        'bg-primary text-ink hover:bg-primary-light focus-visible:ring-ring focus-visible:ring-offset-surface-card flex w-full items-center justify-center leading-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60',
        submitClass[variant],
      )}
    >
      {busy ? 'Aguarde…' : children}
    </button>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="border-error/50 bg-error/10 text-coral rounded-[5px] border px-3 py-2 text-[13px] leading-4"
    >
      {message}
    </p>
  );
}

export function LoginForm({ variant, onSuccess }: AuthFormProps) {
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      onSuccess();
    } catch (error) {
      setFormError(applyApiErrors(error, form.setError, ['email', 'password']));
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-3"
      aria-label="Entrar na conta"
    >
      <FormError message={formError} />
      <TextField
        variant={variant}
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        variant={variant}
        label="Senha"
        hideLabel
        autoComplete="current-password"
        placeholder="***********"
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            toast.info('A recuperação de senha não está disponível nesta demonstração.')
          }
          className="text-text-accent focus-visible:ring-ring text-[14px] leading-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Esqueceu a senha?
        </button>
      </div>
      <div className={cn(variant === 'modal' ? 'pt-3' : 'pt-7')}>
        <SubmitButton variant={variant} busy={login.isPending}>
          Entrar
        </SubmitButton>
      </div>
    </form>
  );
}

export function RegisterForm({ variant, onSuccess }: AuthFormProps) {
  const register = useRegister();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', passwordConfirmation: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register.mutateAsync(values);
      onSuccess();
    } catch (error) {
      setFormError(
        applyApiErrors(error, form.setError, [
          'username',
          'email',
          'password',
          'passwordConfirmation',
        ]),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3" aria-label="Criar conta">
      <FormError message={formError} />
      <TextField
        variant={variant}
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        error={form.formState.errors.username?.message}
        {...form.register('username')}
      />
      <TextField
        variant={variant}
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        variant={variant}
        label="Senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Senha"
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <PasswordField
        variant={variant}
        label="Confirmar senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={form.formState.errors.passwordConfirmation?.message}
        {...form.register('passwordConfirmation')}
      />
      <div className={cn(variant === 'modal' ? 'pt-3' : 'pt-7')}>
        <SubmitButton variant={variant} busy={register.isPending}>
          {variant === 'modal' ? 'Criar conta' : 'Criar perfil'}
        </SubmitButton>
      </div>
    </form>
  );
}

/** Logo do Google (marca, cores próprias) desenhado conforme o ícone do Figma. */
function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
      <path
        fill="#4086F4"
        d="M19.6 10.23c0-.68-.06-1.33-.17-1.96H10v3.7h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.32 2.98-7.26Z"
      />
      <path
        fill="#59C36A"
        d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.58-4.1H1.07v2.57A10 10 0 0 0 10 20Z"
      />
      <path
        fill="#FFDA2D"
        d="M4.42 11.92A6.03 6.03 0 0 1 4.1 10c0-.67.12-1.31.32-1.92V5.5H1.07A10 10 0 0 0 0 10c0 1.62.39 3.15 1.07 4.5l3.35-2.58Z"
      />
      <path
        fill="#FF641A"
        d="M10 3.98c1.47 0 2.78.5 3.82 1.5l2.86-2.87A10 10 0 0 0 1.07 5.5l3.35 2.58C5.2 5.73 7.4 3.98 10 3.98Z"
      />
    </svg>
  );
}

/** "Ou continue com" + Google/Facebook: fora do escopo, nunca aparenta sucesso. */
export function SocialBlock({ variant }: { variant: AuthFormProps['variant'] }) {
  const unavailable = (provider: string) =>
    toast.info(`Entrar com ${provider} não está disponível nesta demonstração.`);
  const buttonClass = cn(
    'flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] leading-4 font-medium text-text-secondary transition-colors hover:border-border-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
  );
  return (
    <div className={cn('flex flex-col', variant === 'modal' ? 'gap-3 pt-6' : 'gap-3')}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="bg-border h-px flex-1" />
        <span className="text-cream text-[13px] leading-4">Ou continue com</span>
        <span aria-hidden="true" className="bg-border h-px flex-1" />
      </div>
      <div className={cn('flex flex-col', variant === 'modal' ? 'gap-3 pt-3' : 'gap-4 pt-3')}>
        <button type="button" className={buttonClass} onClick={() => unavailable('Google')}>
          <GoogleLogo />
          Continuar com Google
        </button>
        <button type="button" className={buttonClass} onClick={() => unavailable('Facebook')}>
          <FacebookIcon className="h-5 w-2.5 text-[#3B5999]" />
          Continuar com Facebook
        </button>
      </div>
    </div>
  );
}

export function AuthSwitchLink({
  mode,
  redirect,
}: {
  mode: 'login' | 'register';
  redirect?: string;
}) {
  return mode === 'login' ? (
    <p className="text-text-secondary text-center text-[15px] leading-5">
      Novo na Kurio?{' '}
      <Link to="/cadastro" search={{ redirect }} className="text-text-accent hover:underline">
        Crie uma conta
      </Link>
    </p>
  ) : (
    <p className="text-text-secondary text-center text-[15px] leading-5">
      Já tem uma conta?{' '}
      <Link to="/entrar" search={{ redirect }} className="text-text-accent hover:underline">
        Entre
      </Link>
    </p>
  );
}
