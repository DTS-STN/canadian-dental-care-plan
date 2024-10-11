import { forwardRef } from 'react';

import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import { ButtonEndIcon, ButtonStartIcon } from './button-icons';
import type { ButtonProps } from './buttons';
import { Button } from './buttons';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingIcon?: FontAwesomeIconProps['icon'];
  loadingIconProps?: OmitStrict<FontAwesomeIconProps, 'icon'>;
  loadingPosition?: 'end' | 'start';
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(({ children, endIcon, endIconProps, disabled = false, loading = false, loadingIcon, loadingIconProps, loadingPosition = 'end', startIcon, startIconProps, ...props }, ref) => {
  const resolvedLoadingIconProps = {
    icon: loadingIcon ?? faSpinner,
    spin: true,
    ...(loadingIconProps ?? {}),
  } satisfies FontAwesomeIconProps;

  const isLoadingAtStartPosition = loading === true && loadingPosition === 'start';
  const resolvedStartIcon = isLoadingAtStartPosition ? resolvedLoadingIconProps : { icon: startIcon, ...(startIconProps ?? {}) };

  const isLoadingAtEndPosition = loading === true && loadingPosition === 'end';
  const resolvedEndIcon = isLoadingAtEndPosition ? resolvedLoadingIconProps : { icon: endIcon, ...(endIconProps ?? {}) };

  return (
    <Button ref={ref} disabled={disabled || loading} {...props}>
      {resolvedStartIcon.icon && <ButtonStartIcon {...resolvedStartIcon} icon={resolvedStartIcon.icon} />}
      <span>{children}</span>
      {resolvedEndIcon.icon && <ButtonEndIcon {...resolvedEndIcon} icon={resolvedEndIcon.icon} />}
    </Button>
  );
});

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
