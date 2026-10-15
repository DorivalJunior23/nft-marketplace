import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { SelectField, TextField, type FieldVariant } from '@/components/forms/field';
import { NETWORKS, WALLET_TYPES } from '@/contracts';
import { cn } from '@/lib/utils';

import type { CollectorFormValues } from '../schemas';

interface CollectorFormProps {
  form: UseFormReturn<CollectorFormValues>;
  variant: FieldVariant;
  /** Layout em duas colunas de 370px (desktop) ou uma coluna (mobile). */
  columns: 1 | 2;
  /** Conteúdo entre os campos e a observação (Figma: o rádio "Usar outra carteira?"). */
  beforeNote?: ReactNode;
}

/** "Perfil do colecionador" do pagamento (Figma): dez campos, observação opcional. */
export function CollectorForm({ form, variant, columns, beforeNote }: CollectorFormProps) {
  const errors = form.formState.errors;
  const grid = cn('grid gap-3', columns === 2 && 'grid-cols-2 gap-x-6');
  const leading = (
    <span
      className="border-border text-cream flex h-10 w-[78px] shrink-0 items-center rounded-[3px] border px-2.5 text-[15px] leading-[15px]"
      aria-hidden="true"
    >
      .eth
    </span>
  );
  return (
    <div className="flex flex-col gap-6">
      <div className={grid}>
        <div className="flex flex-col gap-3">
          <TextField
            variant={variant}
            label="Nome de exibição"
            required
            autoComplete="name"
            error={errors.displayName?.message}
            {...form.register('displayName')}
          />
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
            label="Endereço da carteira"
            required
            placeholder="Endereço 0x da carteira"
            autoComplete="off"
            spellCheck={false}
            error={errors.walletAddress?.message}
            {...form.register('walletAddress')}
          />
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
            label="E-mail"
            required
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...form.register('email')}
          />
        </div>
        <div className="flex flex-col gap-3">
          <TextField
            variant={variant}
            label="Nome de usuário"
            required
            autoComplete="username"
            error={errors.username?.message}
            {...form.register('username')}
          />
          <TextField
            variant={variant}
            label="Nome do perfil"
            required
            error={errors.profileName?.message}
            {...form.register('profileName')}
          />
          <TextField
            variant={variant}
            label="ENS ou carteira secundária"
            hideLabel
            placeholder="ENS ou carteira secundária (opcional)"
            autoComplete="off"
            spellCheck={false}
            error={errors.secondaryAddress?.message}
            wrapperClassName={columns === 2 ? 'pt-[29px]' : undefined}
            {...form.register('secondaryAddress')}
          />
          <TextField
            variant={variant}
            label="Código de indicação"
            required
            error={errors.referralCode?.message}
            {...form.register('referralCode')}
          />
          <TextField
            variant={variant}
            label="Nome ENS"
            required
            error={errors.ensName?.message}
            leading={leading}
            {...form.register('ensName')}
          />
        </div>
      </div>
      {beforeNote}
      <div className="flex max-w-[350px] flex-col gap-3">
        <label htmlFor="checkout-note" className="text-cream text-[15px] leading-[15px]">
          Observação do colecionador (opcional)
        </label>
        <textarea
          id="checkout-note"
          rows={6}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? 'checkout-note-erro' : undefined}
          className="border-border text-cream placeholder:text-brand-secondary focus-visible:border-primary min-h-[152px] w-full rounded-[3px] border bg-transparent px-3 py-2 text-[15px] leading-5 focus-visible:outline-none"
          {...form.register('note')}
        />
        {errors.note ? (
          <p id="checkout-note-erro" role="alert" className="text-coral text-[13px] leading-4">
            {errors.note.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
