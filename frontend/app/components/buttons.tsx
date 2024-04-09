import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import { AppLink } from '~/components/app-link';
import { cn } from '~/utils/tw-utils';

const sizes = {
  xs: 'px-3 py-2 text-xs',
  sm: 'px-3 py-2 text-sm',
  base: 'px-5 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-3.5 text-base',
};

const variants = {
  alternative: 'border-gray-200 bg-white text-gray-900 hover:bg-gray-100 hover:text-blue-700',
  default: 'border-gray-300 bg-gray-200 text-slate-700 hover:bg-neutral-300',
  dark: 'border-gray-800 bg-gray-800 text-white hover:bg-gray-900 hover:bg-gray-900',
  green: 'border-green-700 bg-green-700 text-white hover:bg-green-800 hover:bg-green-800',
  primary: 'border-slate-700 bg-slate-700 text-white hover:bg-sky-800 hover:bg-sky-800',
  red: 'border-red-700 bg-red-700 text-white hover:bg-red-800 hover:bg-red-800',
};

const baseClassName = 'inline-flex items-center justify-center rounded border align-middle font-lato outline-offset-2';

export interface ButtonProps extends ComponentProps<'button'> {
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  pill?: boolean;
}

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, pill, size = 'base', variant = 'default', ...props }, ref) => {
  const disabledClassName = 'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
  const buttonClassName = cn(baseClassName, sizes[size], variants[variant], disabledClassName, pill && 'rounded-full', className);
  return <button className={buttonClassName} {...props} ref={ref} />;
});

Button.displayName = 'Button';

export interface ButtonLinkProps extends ComponentProps<typeof AppLink> {
  disabled?: boolean;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  pill?: boolean;
}

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 *
 * Disabling a link
 * @see https://www.scottohara.me/blog/2021/05/28/disabled-links.html
 */
const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(({ children, className, disabled, pill, size = 'base', to, variant = 'default', ...props }, ref) => {
  const disabledClassName = 'pointer-events-none cursor-not-allowed opacity-70';
  const buttonLinkClassName = cn(baseClassName, sizes[size], variants[variant], pill && 'rounded-full', className);

  if (disabled) {
    return (
      <a className={cn(buttonLinkClassName, disabledClassName)} role="link" aria-disabled="true" {...props} ref={ref}>
        {children}
      </a>
    );
  }

  return (
    <AppLink className={buttonLinkClassName} to={to} {...props} ref={ref}>
      {children}
    </AppLink>
  );
});

ButtonLink.displayName = 'ButtonLink';

export { Button, ButtonLink };
