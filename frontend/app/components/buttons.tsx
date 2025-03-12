import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import { ButtonEndIcon, ButtonStartIcon } from './button-icons';

import { AppLink } from '~/components/app-link';
import { cn } from '~/utils/tw-utils';

type ButtonEndIconProps = ComponentProps<typeof ButtonEndIcon>;
type ButtonStartIconProps = ComponentProps<typeof ButtonStartIcon>;

const sizes = {
  xs: 'px-3 py-2 text-xs',
  sm: 'px-3 py-2 text-sm',
  base: 'px-5 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-3.5 text-base',
};

const variants = {
  alternative: 'border-gray-200 bg-white text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:bg-gray-100 focus:text-blue-700',
  default: 'border-gray-300 bg-gray-200 text-slate-700 hover:bg-neutral-300 focus:bg-neutral-300',
  dark: 'border-gray-800 bg-gray-800 text-white hover:bg-gray-900 focus:bg-gray-900',
  green: 'border-green-700 bg-green-700 text-white hover:bg-green-800 focus:bg-green-800',
  primary: 'border-slate-700 bg-slate-700 text-white hover:bg-sky-800 focus:bg-sky-800',
  red: 'border-red-700 bg-red-700 text-white hover:bg-red-800 focus:bg-red-800',
  link: 'text-slate-700 underline hover:text-blue-700 focus:text-blue-700 border-none px-0',
};

const baseClassName = 'inline-flex items-center justify-center rounded-sm border align-middle font-lato outline-offset-4';

export interface ButtonProps extends ComponentProps<'button'> {
  endIcon?: ButtonEndIconProps['icon'];
  endIconProps?: OmitStrict<ButtonEndIconProps, 'icon'>;
  pill?: boolean;
  size?: keyof typeof sizes;
  startIcon?: ButtonStartIconProps['icon'];
  startIconProps?: OmitStrict<ButtonStartIconProps, 'icon'>;
  variant?: keyof typeof variants;
}

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, endIcon, endIconProps, pill, size = 'base', startIcon, startIconProps, variant = 'default', ...props }, ref) => {
  const disabledClassName = 'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
  const buttonClassName = cn(baseClassName, sizes[size], variants[variant], disabledClassName, pill && 'rounded-full', className);
  return (
    <button className={buttonClassName} {...props} ref={ref}>
      {startIcon && <ButtonStartIcon {...(startIconProps ?? {})} icon={startIcon} />}
      {children}
      {endIcon && <ButtonEndIcon {...(endIconProps ?? {})} icon={endIcon} />}
    </button>
  );
});

Button.displayName = 'Button';

export interface ButtonLinkProps extends ComponentProps<typeof AppLink> {
  disabled?: boolean;
  endIcon?: ButtonEndIconProps['icon'];
  endIconProps?: OmitStrict<ButtonEndIconProps, 'icon'>;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  startIcon?: ButtonStartIconProps['icon'];
  startIconProps?: OmitStrict<ButtonStartIconProps, 'icon'>;
  pill?: boolean;
}

/**
 * Tailwind CSS Buttons from Flowbite
 * @see https://flowbite.com/docs/components/buttons/
 *
 * Disabling a link
 * @see https://www.scottohara.me/blog/2021/05/28/disabled-links.html
 */
const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(({ children, className, disabled, endIcon, endIconProps, pill, size = 'base', routeId, startIcon, startIconProps, to, variant = 'default', ...props }, ref) => {
  const disabledClassName = 'pointer-events-none cursor-not-allowed opacity-70';
  const buttonLinkClassName = cn(baseClassName, sizes[size], variants[variant], pill && 'rounded-full', className);

  const actualChildren = (
    <>
      {startIcon && <ButtonStartIcon {...(startIconProps ?? {})} icon={startIcon} />}
      {children}
      {endIcon && <ButtonEndIcon {...(endIconProps ?? {})} icon={endIcon} />}
    </>
  );

  if (disabled) {
    return (
      <a className={cn(buttonLinkClassName, disabledClassName)} role="link" aria-disabled="true" {...props} ref={ref}>
        {actualChildren}
      </a>
    );
  }

  return (
    <AppLink className={buttonLinkClassName} routeId={routeId} to={to} {...props} ref={ref}>
      {actualChildren}
    </AppLink>
  );
});

ButtonLink.displayName = 'ButtonLink';

export { Button, ButtonLink };
