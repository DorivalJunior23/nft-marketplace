import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { SelectField, TextField, type FieldVariant } from '@/components/forms/field';
import {
  NETWORKS,
  WALLET_TYPES,
  type Wallet,
  type WalletInput,
  type WalletKind,
} from '@/contracts';
import { useIsDesktop } from '@/hooks/use-media-query';
import { applyApiErrors } from '@/lib/form-errors';
import { cn } from '@/lib/utils';

import { useSaveWallet } from './queries';
import { walletToValues } from './wallet-values';

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

const walletSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.'),
  walletAlias: z.string().trim().min(1, 'Informe o apelido da carteira.'),
  network: z.enum(['ethereum', 'polygon', 'solana'], { message: 'Selecione uma rede.' }),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.'),
  address: z
    .string()
    .trim()
    .regex(ADDRESS, 'Informe um endereço 0x com 40 caracteres hexadecimais.'),
  secondaryAddress: z
    .string()
    .trim()
    .refine(
      (value) => !value || ADDRESS.test(value) || /^[a-z0-9-]{3,40}(\.eth)?$/i.test(value),
      'Informe um endereço 0x ou um nome ENS.',
    ),
  walletType: z.enum(['metamask', 'walletconnect', 'coinbase'], {
    message: 'Selecione uma carteira.',
  }),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  ensName: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,40}$/, 'Use de 3 a 40 caracteres: letras minúsculas, números ou hífen.'),
});

export type WalletFormValues = z.infer<typeof walletSchema>;

interface WalletFormProps {
  kind: WalletKind;
  wallet: Wallet | null;
  initialValues?: Partial<WalletFormValues>;
  submitLabel?: string;
  onSaved?: (wallet: Wallet) => void;
  formId?: string;
}

/** Formulário de carteira do Figma: 5 linhas de 2 colunas (417px), selects de rede e tipo, ENS com prefixo .eth. */
export function WalletForm({
  kind,
  wallet,
  initialValues,
  submitLabel = 'Salvar carteira',
  onSaved,
  formId,
}: WalletFormProps) {
  const isDesktop = useIsDesktop();
  const variant: FieldVariant = isDesktop ? 'account' : 'mobile';
  const save = useSaveWallet();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: walletToValues(wallet, initialValues),
  });

  useEffect(() => {
    form.reset(walletToValues(wallet, initialValues));
  }, [wallet, initialValues, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const input: WalletInput = {
      ...values,
      kind,
      secondaryAddress: values.secondaryAddress || null,
    };
    try {
      const saved = await save.mutateAsync({ walletId: wallet?.id ?? null, input });
      toast.success(
        kind === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.',
      );
      onSaved?.(saved);
    } catch (error) {
      setFormError(
        applyApiErrors(error, form.setError, [
          'displayName',
          'walletAlias',
          'network',
          'profileName',
          'address',
          'secondaryAddress',
          'walletType',
          'referralCode',
          'email',
          'ensName',
        ]),
      );
    }
  });

  const errors = form.formState.errors;
  const row = cn('grid gap-6', isDesktop && 'grid-cols-2 items-end gap-x-7');

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-8"
      data-testid={`wallet-form-${kind}`}
    >
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
            error={errors.displayName?.message}
            {...form.register('displayName')}
          />
          <TextField
            variant={variant}
            label="Apelido da carteira"
            required
            error={errors.walletAlias?.message}
            {...form.register('walletAlias')}
          />
        </div>
        <div className={row}>
          <SelectField
            variant={variant}
            label="Rede"
            required
            placeholder="Selecione uma rede"
            options={Object.values(NETWORKS).map((network) => ({
              value: network.id,
              label: network.name,
            }))}
            error={errors.network?.message}
            {...form.register('network')}
          />
          <TextField
            variant={variant}
            label="Nome do perfil"
            required
            error={errors.profileName?.message}
            {...form.register('profileName')}
          />
        </div>
        <div className={row}>
          <TextField
            variant={variant}
            label="Endereço da carteira"
            required
            placeholder="Endereço 0x da carteira"
            autoComplete="off"
            spellCheck={false}
            error={errors.address?.message}
            {...form.register('address')}
          />
          <TextField
            variant={variant}
            label="ENS ou carteira secundária"
            hideLabel
            placeholder="ENS ou carteira secundária (opcional)"
            autoComplete="off"
            spellCheck={false}
            error={errors.secondaryAddress?.message}
            {...form.register('secondaryAddress')}
          />
        </div>
        <div className={row}>
          <SelectField
            variant={variant}
            label="Tipo de carteira"
            required
            placeholder="Selecione uma carteira"
            options={WALLET_TYPES.map((type) => ({ value: type.id, label: type.name }))}
            error={errors.walletType?.message}
            {...form.register('walletType')}
          />
          <TextField
            variant={variant}
            label="Código de indicação"
            required
            error={errors.referralCode?.message}
            {...form.register('referralCode')}
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
      </div>
      <button
        type="submit"
        disabled={save.isPending}
        aria-busy={save.isPending || undefined}
        className="bg-primary text-ink hover:bg-primary-light focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-[131px] items-center justify-center rounded-[3px] text-[14px] leading-4 font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {save.isPending ? 'Salvando…' : submitLabel}
      </button>
    </form>
  );
}
