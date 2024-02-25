import { forwardRef } from 'react';
import type { ComponentProps } from 'react';

import { Link } from '@remix-run/react';

import { cn } from '~/utils/tw-utils';

const sizes = {
  xs: 'px-3 py-2 text-xs',
  sm: 'px-3 py-2 text-sm',
  base: 'px-5 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-3.5 text-base',
};

const variants = {
  alternative: 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-100 hover:text-blue-700',
  default: 'border border-gray-300 bg-gray-200 text-slate-700 hover:bg-neutral-300',
  dark: 'bg-gray-800 text-white hover:bg-gray-900',
  green: 'bg-green-700 text-white hover:bg-green-800',
  primary: 'bg-slate-700 text-white hover:bg-sky-800',
  red: 'bg-red-700 text-white hover:bg-red-800',
};

const baseClassName = 'inline-flex items-center justify-center rounded align-middle font-medium outline-offset-2';
const disableClassName = 'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';

export interface ButtonProps extends ComponentProps<'button'> {
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  pill?: boolean;
}

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, pill, size, variant, ...props }, ref) => {
  return <button className={cn(baseClassName, sizes[size ?? 'base'], variants[variant ?? 'default'], props.disabled && disableClassName, pill && 'rounded-full', className)} {...props} ref={ref} />;
});

Button.displayName = 'Button';

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  pill?: boolean;
}

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 */
const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(({ children, className, pill, size, variant, ...props }, ref) => {
  return (
    <Link className={cn(baseClassName, sizes[size ?? 'base'], variants[variant ?? 'default'], pill && 'rounded-full', className)} {...props} ref={ref}>
      {children}
    </Link>
  );
});

ButtonLink.displayName = 'ButtonLink';

export { Button, ButtonLink };
