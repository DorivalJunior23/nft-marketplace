import { Slider as SliderPrimitive } from 'radix-ui';
import { useMemo, type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Slider de faixa com o visual do Figma: trilho laranja 4px e alças de 15px com borda Ink. */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  const values = useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-primary relative h-1 w-full grow overflow-hidden rounded-full"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={index === 0 ? 'Preço mínimo' : 'Preço máximo'}
          className="border-ink bg-primary ring-primary/40 block size-[15px] shrink-0 rounded-full border-[3px] transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
