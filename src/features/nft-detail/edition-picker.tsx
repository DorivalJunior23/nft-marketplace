import { useId, useRef, type KeyboardEvent } from 'react';

import type { NftEdition } from '@/contracts';
import { cn } from '@/lib/utils';

interface EditionPickerProps {
  editions: NftEdition[];
  value: NftEdition['id'];
  onChange: (id: NftEdition['id']) => void;
}

/**
 * Pílulas de edição do Figma (28px, borda Border; selecionada com borda laranja e texto accent).
 * Padrão ARIA de radiogroup: um único tab stop e as setas movem a seleção entre as edições.
 */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(
    0,
    editions.findIndex((edition) => edition.id === value),
  );

  const moveTo = (index: number) => {
    const edition = editions[index];
    if (!edition) return;
    onChange(edition.id);
    buttons.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = editions.length - 1;
    const next: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = next[event.key];
    if (target === undefined) return;
    event.preventDefault();
    moveTo(target);
  };

  return (
    <div className="flex flex-col gap-3">
      <p id={id} className="text-cream text-[15px] leading-4 font-bold">
        Edição:
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap items-center gap-1.5">
        {editions.map((edition, index) => {
          const selected = edition.id === value;
          const unavailable = edition.status !== 'available';
          return (
            <button
              key={edition.id}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={unavailable || undefined}
              aria-label={`Edição ${edition.label}${unavailable ? ', esgotada' : `, ${edition.available} disponíveis`}`}
              tabIndex={index === selectedIndex ? 0 : -1}
              onClick={() => onChange(edition.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
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
