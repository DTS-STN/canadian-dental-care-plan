import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { cn } from '~/utils/tw-utils';

export function ButtonStartIcon({ className, ...restProps }: FontAwesomeIconProps) {
  return <FontAwesomeIcon className={cn('me-2', className)} {...restProps} />;
}

export function ButtonEndIcon({ className, ...restProps }: FontAwesomeIconProps) {
  return <FontAwesomeIcon className={cn('ms-2', className)} {...restProps} />;
}
