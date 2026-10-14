import { useId } from 'react';

import type { NftEdition } from '@/contracts';
import { cn } from '@/lib/utils';

interface EditionPickerProps {
  editions: NftEdition[];
  value: NftEdition['id'];
  onChange: (id: NftEdition['id']) => void;
}

/** Pílulas de edição do Figma (28px, borda Border; selecionada com borda laranja e texto accent). */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-3">
      <p id={id} className="text-cream text-[15px] leading-4 font-bold">
        Edição:
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap items-center gap-1.5">
        {editions.map((edition) => {
          const selected = edition.id === value;
          const unavailable = edition.status !== 'available';
          return (
            <button
              key={edition.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={unavailable || undefined}
              aria-label={`Edição ${edition.label}${unavailable ? ', esgotada' : `, ${edition.available} disponíveis`}`}
              onClick={() => onChange(edition.id)}
              className={cn(
                'focus-visible:ring-ring focus-visible:ring-offset-background flex h-7 items-center justify-center rounded-full border px-2 text-[14px] leading-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                selected
                  ? 'border-primary text-text-accent font-medium'
                  : 'border-border text-text-secondary hover:border-primary/60',
                unavailable && 'line-through opacity-60',
              )}
            >
              {edition.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
