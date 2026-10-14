import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

import { ArrowDownIcon, EyeOffIcon } from '@/components/icons';
import { describedBy } from '@/lib/a11y';
import { cn } from '@/lib/utils';

export type FieldVariant = 'account' | 'modal' | 'mobile';

/** Campos do Figma: conta (raio 3, label acima com asterisco), modal (raio 5) e mobile (raio 10, 50px). */
const INPUT_BY_VARIANT: Record<FieldVariant, string> = {
  account: 'h-10 rounded-[3px] px-[13px] text-[15px] leading-[15px]',
  modal: 'h-10 rounded-[5px] px-4 text-[14px] leading-4',
  mobile: 'h-[50px] rounded-[10px] px-4 text-[14px] leading-4',
};

export const inputBaseClass =
  'w-full min-w-0 border border-border bg-transparent text-cream placeholder:text-brand-secondary transition-colors hover:border-border-soft focus-visible:border-primary focus-visible:outline-none aria-invalid:border-error disabled:cursor-not-allowed disabled:opacity-60';

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  variant: FieldVariant;
  children: ReactNode;
  className?: string;
  /** Mobile/modal escondem o rótulo visualmente (o placeholder faz o papel visual, como no Figma). */
  hideLabel?: boolean;
}

export function FieldShell({
  id,
  label,
  required,
  error,
  hint,
  variant,
  children,
  className,
  hideLabel,
}: FieldShellProps) {
  const errorId = `${id}-erro`;
  const hintId = `${id}-ajuda`;
  return (
    <div className={cn('flex flex-col', variant === 'account' ? 'gap-2.5' : 'gap-1.5', className)}>
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            'text-cream flex items-center text-[15px] leading-[15px]',
            hideLabel && 'sr-only',
          )}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="text-coral ml-px text-[22px] leading-[29px]">
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> (obrigatório)</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-coral text-[13px] leading-4">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-text-secondary text-[13px] leading-4">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  variant?: FieldVariant;
  hideLabel?: boolean;
  wrapperClassName?: string;
  /** Elemento fixo à esquerda do campo (ex.: seletor ".eth"). */
  leading?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id: externalId,
      label,
      error,
      hint,
      required,
      variant = 'account',
      hideLabel,
      className,
      wrapperClassName,
      leading,
      ...props
    },
    ref,
  ) => {
    const generated = useId();
    const id = externalId ?? generated;
    return (
      <FieldShell
        id={id}
        label={label}
        required={required}
        error={error}
        hint={hint}
        variant={variant}
        hideLabel={hideLabel}
        className={wrapperClassName}
      >
        <div className={cn('flex gap-2.5', !leading && 'contents')}>
          {leading}
          <input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, error, hint)}
            aria-required={required || undefined}
            className={cn(inputBaseClass, INPUT_BY_VARIANT[variant], className)}
            {...props}
          />
        </div>
      </FieldShell>
    );
  },
);
TextField.displayName = 'TextField';

export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id: externalId,
      label,
      error,
      hint,
      required,
      variant = 'account',
      hideLabel,
      className,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    const generated = useId();
    const id = externalId ?? generated;
    const [visible, setVisible] = useState(false);
    return (
      <FieldShell
        id={id}
        label={label}
        required={required}
        error={error}
        hint={hint}
        variant={variant}
        hideLabel={hideLabel}
        className={wrapperClassName}
      >
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, error, hint)}
            aria-required={required || undefined}
            className={cn(inputBaseClass, INPUT_BY_VARIANT[variant], 'pr-11', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className={cn(
              'text-brand-secondary hover:text-text-accent focus-visible:ring-ring absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-[4px] focus-visible:ring-2 focus-visible:outline-none',
              variant === 'mobile' && 'text-border-soft',
            )}
          >
            <EyeOffIcon className={cn('h-5 w-[23px]', visible && 'opacity-50')} />
          </button>
        </div>
      </FieldShell>
    );
  },
);
PasswordField.displayName = 'PasswordField';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  variant?: FieldVariant;
  placeholder?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  wrapperClassName?: string;
}

/** Select nativo (acessível por padrão) com a seta do Figma. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      id: externalId,
      label,
      error,
      hint,
      required,
      variant = 'account',
      placeholder,
      options,
      className,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    const generated = useId();
    const id = externalId ?? generated;
    return (
      <FieldShell
        id={id}
        label={label}
        required={required}
        error={error}
        hint={hint}
        variant={variant}
        className={wrapperClassName}
      >
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, error, hint)}
            aria-required={required || undefined}
            className={cn(
              inputBaseClass,
              INPUT_BY_VARIANT[variant],
              'invalid:text-brand-secondary appearance-none pr-10',
              className,
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" className="bg-surface-card text-brand-secondary">
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-surface-card text-cream"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ArrowDownIcon
            aria-hidden="true"
            className="text-brand-secondary pointer-events-none absolute top-1/2 right-2 size-5 -translate-y-1/2"
          />
        </div>
      </FieldShell>
    );
  },
);
SelectField.displayName = 'SelectField';
