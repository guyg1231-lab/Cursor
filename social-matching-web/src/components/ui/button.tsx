import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary:
          'bg-[linear-gradient(180deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.94)_100%)] text-primary-foreground shadow-[0_16px_28px_-18px_hsl(var(--primary)/0.78)] hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,hsl(var(--primary)/0.96)_0%,hsl(var(--primary)/0.9)_100%)] hover:shadow-[0_20px_30px_-16px_hsl(var(--primary)/0.72)]',
        default: 'bg-foreground text-background shadow-sm hover:bg-foreground/92 hover:shadow-md',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/92 hover:shadow-md',
        outline:
          'border-border/80 bg-card text-foreground shadow-[0_10px_22px_-18px_hsl(var(--foreground)/0.35)] hover:-translate-y-[1px] hover:bg-background hover:text-foreground hover:border-foreground/10',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[0_10px_22px_-18px_hsl(var(--foreground)/0.25)] hover:bg-secondary/88 hover:-translate-y-[1px]',
        ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-4',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
