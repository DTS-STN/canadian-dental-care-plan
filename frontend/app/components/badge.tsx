import type * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '~/utils/tw-utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none',
  {
    variants: {
      size: {
        base: 'px-1.5 py-0.5 text-xs [&>svg]:size-3',
        lg: 'px-2 py-1 text-sm leading-none [&>svg]:size-3.5',
      },
      variant: {
        danger: 'bg-red-700 text-white [a&]:hover:bg-red-700/90',
        default: 'border-gray-300 bg-white text-black [a&]:hover:bg-gray-100',
        gray: 'bg-gray-500 text-white [a&]:hover:bg-gray-500/90',
        info: 'bg-blue-700 text-white [a&]:hover:bg-blue-700/90',
        success: 'bg-green-700 text-white [a&]:hover:bg-green-700/90',
        warning: 'bg-yellow-600 text-white [a&]:hover:bg-yellow-600/90',
      },
    },
    defaultVariants: {
      size: 'base',
      variant: 'default',
    },
  },
);

interface BadgeProps extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

export function Badge({ className, variant, size, asChild = false, ...props }: BadgeProps) {
  const BadgePrimitive = asChild ? Slot : 'span';
  return <BadgePrimitive data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
