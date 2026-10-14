import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ErrorState } from '@/components/common/query-state';
import { Shimmer } from '@/components/common/shimmer';
import { PasswordField, TextField, type FieldVariant } from '@/components/forms/field';
import { ImageIcon } from '@/components/icons';
import type { Profile } from '@/contracts';
import { passwordSchema, usernameSchema } from '@/features/auth/schemas';
import { useIsDesktop } from '@/hooks/use-media-query';
import { applyApiErrors } from '@/lib/form-errors';
import { cn } from '@/lib/utils';

import { AccountLayout } from './account-layout';
import { useChangePassword, useProfile, useUpdateAvatar, useUpdateProfile } from './queries';

const profileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Use de 2 a 40 caracteres.')
      .max(40, 'Use de 2 a 40 caracteres.'),
    username: usernameSchema,
    email: z.string().trim().email('Informe um e-mail válido.'),
    ensName: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^(?=.{3,40}$)[a-z0-9-]+(\.[a-z0-9-]+)*$/,
        'Use de 3 a 40 caracteres: letras minúsculas, números, hífen ou ponto.',
      ),
    walletAlias: z
      .string()
      .trim()
      .min(1, 'Informe o apelido da carteira.')
      .max(40, 'Use no máximo 40 caracteres.'),
    currentPassword: z.string(),
    newPassword: z.string(),
    newPasswordConfirmation: z.string(),
  })
  .superRefine((data, ctx) => {
    const wantsChange = data.currentPassword || data.newPassword || data.newPasswordConfirmation;
    if (!wantsChange) return;
    if (!data.currentPassword)
      ctx.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe a senha atual.',
      });
    const parsed = passwordSchema.safeParse(data.newPassword);
    if (!parsed.success)
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: parsed.error.issues[0]?.message ?? 'Senha inválida.',
      });
    if (data.newPassword !== data.newPasswordConfirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPasswordConfirmation'],
        message: 'As senhas não coincidem.',
      });
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

function toFormValues(profile: Profile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName ?? '',
    walletAlias: profile.walletAlias ?? '',
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: '',
  };
}

const MAX_AVATAR_SIDE = 256;

/** Redimensiona a imagem no navegador para caber no limite da API e manter o avatar leve. */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_AVATAR_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível processar a imagem.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.85);
}

function AvatarField({ profile, variant }: { profile: Profile; variant: FieldVariant }) {
  const updateAvatar = useUpdateAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Envie um arquivo de imagem.');
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await updateAvatar.mutateAsync({ dataUrl });
      toast.success('Avatar atualizado.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar o avatar.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    setError(null);
    try {
      await updateAvatar.mutateAsync(null);
      toast.success('Avatar removido.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível remover o avatar.');
    }
  };

  return (
    <div className={cn('flex flex-col', variant === 'account' ? 'gap-2.5' : 'gap-1.5')}>
      <p className="text-cream text-[15px] leading-[15px]" id="avatar-label">
        Avatar
      </p>
      <div className="flex items-center gap-6" role="group" aria-labelledby="avatar-label">
        <div className="border-border bg-surface-raised text-primary flex size-[50px] items-center justify-center overflow-hidden rounded-full border">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`Avatar de ${profile.displayName}`}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-6" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          id="avatar-input"
          onChange={(event) => void onFile(event.target.files?.[0])}
          aria-describedby={error ? 'avatar-erro' : undefined}
        />
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-busy={updateAvatar.isPending || undefined}
            className="bg-primary text-ink hover:bg-primary-light focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-[98px] items-center justify-center rounded-[3px] text-[14px] leading-4 font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
            disabled={updateAvatar.isPending}
          >
            Alterar
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={!profile.avatarUrl || updateAvatar.isPending}
            className="text-cream hover:text-text-accent focus-visible:ring-ring text-[14px] leading-4 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      </div>
      {error ? (
        <p id="avatar-erro" role="alert" className="text-coral text-[13px] leading-4">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const isDesktop = useIsDesktop();
  const variant: FieldVariant = isDesktop ? 'account' : 'mobile';
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
  });

  useEffect(() => {
    form.reset(toFormValues(profile));
  }, [profile, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateProfile.mutateAsync({
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        ensName: values.ensName,
        walletAlias: values.walletAlias,
      });
      if (values.newPassword) {
        await changePassword.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          newPasswordConfirmation: values.newPasswordConfirmation,
        });
        form.setValue('currentPassword', '');
        form.setValue('newPassword', '');
        form.setValue('newPasswordConfirmation', '');
        toast.success('Perfil e senha atualizados.');
      } else {
        toast.success('Perfil atualizado.');
      }
    } catch (error) {
      setFormError(
        applyApiErrors(error, form.setError, [
          'displayName',
          'username',
          'email',
          'ensName',
          'walletAlias',
          'currentPassword',
          'newPassword',
          'newPasswordConfirmation',
        ]),
      );
    }
  });

  const busy = updateProfile.isPending || changePassword.isPending;
  const errors = form.formState.errors;
  const row = cn('grid gap-6', isDesktop && 'grid-cols-2 gap-x-7');

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-8"
      aria-labelledby="perfil-titulo"
    >
      <h1 id="perfil-titulo" className="text-cream text-[16px] leading-4 font-bold">
        Perfil do colecionador
      </h1>
      {formError ? (
        <p
          role="alert"
          className="border-error/50 bg-error/10 text-coral rounded-[3px] border px-3 py-2 text-[13px] leading-4"
        >
          {formError}
        </p>
      ) : null}
      <div className="flex flex-col gap-6">
        <div className={row}>
          <TextField
            variant={variant}
            label="Nome de exibição"
            required
            autoComplete="name"
            error={errors.displayName?.message}
            {...form.register('displayName')}
          />
          <TextField
            variant={variant}
            label="Nome de usuário"
            required
            autoComplete="username"
            error={errors.username?.message}
            {...form.register('username')}
          />
        </div>
        <div className={row}>
          <TextField
            variant={variant}
            label="E-mail"
            required
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...form.register('email')}
          />
          <TextField
            variant={variant}
            label="Nome ENS"
            required
            error={errors.ensName?.message}
            leading={
              <span
                className="border-border text-cream flex h-10 w-[78px] shrink-0 items-center justify-between rounded-[3px] border px-2.5 text-[15px] leading-[15px]"
                aria-hidden="true"
              >
                .eth
              </span>
            }
            {...form.register('ensName')}
          />
        </div>
        <div className={row}>
          <TextField
            variant={variant}
            label="Apelido da carteira"
            required
            error={errors.walletAlias?.message}
            {...form.register('walletAlias')}
          />
          <AvatarField profile={profile} variant={variant} />
        </div>
      </div>
      <fieldset className="flex flex-col gap-6">
        <legend className="text-cream text-[16px] leading-4 font-medium">Alterar senha</legend>
        <div className={cn('flex flex-col gap-6 pt-6', isDesktop && 'max-w-[417px]')}>
          <PasswordField
            variant={variant}
            label="Senha atual"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...form.register('currentPassword')}
          />
          <PasswordField
            variant={variant}
            label="Nova senha"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...form.register('newPassword')}
          />
          <PasswordField
            variant={variant}
            label="Confirmar nova senha"
            autoComplete="new-password"
            error={errors.newPasswordConfirmation?.message}
            {...form.register('newPasswordConfirmation')}
          />
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy || undefined}
        className="bg-primary text-ink hover:bg-primary-light focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-[131px] items-center justify-center rounded-[3px] text-[14px] leading-4 font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {busy ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  );
}

export function ProfilePage() {
  const profile = useProfile();
  return (
    <AccountLayout title="Dados do perfil">
      {profile.isPending ? (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando perfil">
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-10 w-full" />
          <Shimmer className="h-10 w-full" />
          <Shimmer className="h-10 w-2/3" />
        </div>
      ) : profile.isError ? (
        <ErrorState
          error={profile.error}
          onRetry={() => void profile.refetch()}
          title="Não foi possível carregar o perfil"
        />
      ) : (
        <ProfileForm profile={profile.data} />
      )}
    </AccountLayout>
  );
}
