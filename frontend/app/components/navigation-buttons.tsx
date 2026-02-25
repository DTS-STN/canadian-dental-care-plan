import type { ComponentProps } from 'react';

import { faChevronCircleLeft, faChevronCircleRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { LoadingButton } from '~/components/loading-button';
import { cn } from '~/utils/tw-utils';

interface NavigationButtonBase {
  direction: 'previous' | 'next';
}

interface NavigationButtonProps extends OmitStrict<ComponentProps<typeof LoadingButton>, 'endIcon' | 'endIconProps' | 'startIcon' | 'startIconProps' | 'loadingIconProps'>, NavigationButtonBase {}

/**
 * A navigation button component that displays directional navigation with icons and labels.
 *
 * @returns A styled button component with directional icons and two-line text layout
 *
 * @example
 * ```tsx
 * <NavigationButton direction="next">
 *   Continue to Next Step
 * </NavigationButton>
 * ```
 */
export function NavigationButton({ children, className, direction, ...props }: NavigationButtonProps) {
  const { t } = useTranslation(['common']);
  const endIcon = direction === 'next' ? faChevronCircleRight : undefined;
  const startIcon = direction === 'previous' ? faChevronCircleLeft : undefined;

  return (
    <LoadingButton className={cn('gap-2 text-left', className)} endIcon={endIcon} startIcon={startIcon} endIconProps={{ className: 'text-3xl' }} startIconProps={{ className: ' text-3xl' }} loadingIconProps={{ className: 'text-3xl' }} {...props}>
      <span className="space-y-1 sm:space-y-2">
        <span className="block text-sm font-normal sm:text-base">{t(`common:navigation.${direction}`)}</span>
        <span className="text-base sm:text-lg">{children}</span>
      </span>
    </LoadingButton>
  );
}

interface NavigationButtonLinkProps extends OmitStrict<ComponentProps<typeof ButtonLink>, 'endIcon' | 'endIconProps' | 'startIcon' | 'startIconProps'>, NavigationButtonBase {}

/**
 * A navigation link component that displays directional navigation with icons and labels.
 *
 * @returns A styled link component with directional icons and two-line text layout
 *
 * @example
 * ```tsx
 * <NavigationButtonLink direction="previous" to="/previous-page">
 *   Back to Previous Step
 * </NavigationButtonLink>
 * ```
 */
export function NavigationButtonLink({ children, className, direction, ...props }: NavigationButtonLinkProps) {
  const { t } = useTranslation(['common']);
  const endIcon = direction === 'next' ? faChevronCircleRight : undefined;
  const startIcon = direction === 'previous' ? faChevronCircleLeft : undefined;
  return (
    <ButtonLink className={cn('gap-2 text-left', className)} endIcon={endIcon} startIcon={startIcon} endIconProps={{ className: 'text-3xl' }} startIconProps={{ className: ' text-3xl' }} {...props}>
      <span className="space-y-1 sm:space-y-2">
        <span className="block text-sm font-normal sm:text-base">{t(`common:navigation.${direction}`)}</span>
        <span className="text-base sm:text-lg">{children}</span>
      </span>
    </ButtonLink>
  );
}
