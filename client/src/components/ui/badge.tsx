import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        student:
          'border-transparent bg-blue-400 text-white hover:bg-blue-400/80',
        coordinator:
          'border-transparent bg-yellow-400 text-white hover:bg-yellow-400/80',
        admin: 'border-transparent bg-red-400 text-white hover:bg-red-400/80',
        ['pre-ojt']:
          'border-transparent bg-yellow-400 text-white hover:bg-yellow-400/80',
        ['post-ojt']:
          'border-transparent bg-blue-400 text-white hover:bg-blue-400/80',
        ojt: 'border-transparent bg-red-400 text-white hover:bg-red-400/80',
        completed:
          'border-transparent bg-green-400 text-white hover:bg-green-400/80',
        approved:
          'border-transparent bg-green-400 text-white hover:bg-green-400/80',
        resubmit:
          'border-transparent bg-red-400 text-white hover:bg-red-400/80',
        rejected:
          'border-transparent bg-red-400 text-white hover:bg-red-400/80',
        pending:
          'border-transparent bg-yellow-400 text-white hover:bg-yellow-400/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
