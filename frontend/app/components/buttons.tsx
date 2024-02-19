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
  alternative: 'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-gray-200',
  default: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-gray-200',
  dark: 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-300',
  green: 'bg-green-700 text-white hover:bg-green-800 focus:ring-green-300',
  primary: 'bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-300',
  red: 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-300',
};

const baseClassName = 'inline-flex items-center justify-center align-middle font-medium focus:outline-none focus:ring-4';
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
  return <button className={cn(baseClassName, sizes[size ?? 'base'], variants[variant ?? 'default'], props.disabled && disableClassName, pill ? 'rounded-full' : 'rounded-lg', className)} {...props} ref={ref} />;
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
    <Link className={cn(baseClassName, sizes[size ?? 'base'], variants[variant ?? 'default'], pill ? 'rounded-full' : 'rounded-lg', className)} {...props} ref={ref}>
      {children}
    </Link>
  );
});

ButtonLink.displayName = 'ButtonLink';

export { Button, ButtonLink };
