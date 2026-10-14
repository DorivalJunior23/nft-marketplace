import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/** Botões do Figma: primário laranja com texto Ink, contorno Border e variantes de texto. */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[6px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: 'bg-primary text-ink hover:bg-primary-light active:bg-primary-dark',
        outline:
          'border border-border bg-transparent text-cream hover:border-primary hover:text-text-accent',
        ghost: 'bg-transparent text-cream hover:text-text-accent',
        link: 'h-auto rounded-none bg-transparent p-0 text-text-accent underline-offset-4 hover:underline',
        danger: 'border border-error/60 bg-transparent text-coral hover:bg-error/10',
      },
      size: {
        sm: 'h-9 px-3 text-[16px] leading-5 font-bold',
        md: 'h-10 px-7 text-[16px] leading-5 font-bold',
        lg: 'h-12 px-8 text-[16px] leading-5 font-bold',
        compact: 'h-[35px] px-[9px] text-[16px] leading-[21px] font-medium',
        cta: 'h-10 px-[26px] text-[14px] leading-5 font-medium',
        icon: 'size-[35px] rounded-[4px] p-2',
        none: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Renderiza o filho como elemento raiz (ex.: Link do Router) mantendo os estilos. */
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
      <Comp
        ref={ref}
        data-slot="button"
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
