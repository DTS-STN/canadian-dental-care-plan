import type { ComponentProps } from 'react';

import { DiffViewer } from './diff-viewer';
import { formatAddress } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

interface Address {
  address: string;
  apartment?: string;
  city: string;
  country: string;
  postalZipCode?: string;
  provinceState?: string;
}

export interface AddressDiffProps extends ComponentProps<'address'> {
  altFormat?: boolean;
  newAddress: Address;
  oldAddress: Address;
}

export function AddressDiff({ altFormat, oldAddress, newAddress, className, ...restProps }: AddressDiffProps) {
  const formattedOldAddress = formatAddress({ ...oldAddress, altFormat });
  const formattedNewAddress = formatAddress({ ...newAddress, altFormat });
  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-diff" {...restProps}>
      <DiffViewer oldStr={formattedOldAddress} newStr={formattedNewAddress} />
    </address>
  );
}
