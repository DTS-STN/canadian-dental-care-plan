import type { ComponentProps } from 'react';

import { Slot } from '@radix-ui/react-slot';

import { cn } from '~/utils/tw-utils';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={cn('flex flex-col gap-6 rounded-lg border bg-white py-6 shadow-sm', className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6', className)} {...props} />;
}

interface CardTitleProps extends ComponentProps<'h3'> {
  asChild?: boolean;
}

export function CardTitle({ asChild, className, ...props }: CardTitleProps) {
  const CardTitlePrimitive = asChild ? Slot : 'h3';
  return <CardTitlePrimitive data-slot="card-title" className={cn('font-lato text-xl leading-none font-bold', className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-black/50', className)} {...props} />;
}

export function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('-mb-6 flex items-center px-6 pb-6 [.border-t]:pt-6', className)} {...props} />;
}
