import type { ComponentProps } from 'react';

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

export interface AddressProps extends ComponentProps<'address'> {
  address: Address;
  altFormat?: boolean;
}

export function Address({ address, altFormat = false, className, ...restProps }: AddressProps) {
  const formattedAddress = formatAddress({ ...address, altFormat });
  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...restProps}>
      {formattedAddress}
    </address>
  );
}
