import type { ComponentProps } from 'react';

import { formatAddress } from '~/utils/string-utils';
import { cn } from '~/utils/tw-utils';

export interface AddressProps extends ComponentProps<'address'> {
  address: string;
  city: string;
  country: string;
  provinceState?: string;
  postalZipCode?: string;
  apartment?: string;
  altFormat?: boolean;
}

export function Address({ address, city, provinceState, postalZipCode, country, className, altFormat, apartment, ...restProps }: AddressProps) {
  const formattedAddress = formatAddress(address, city, country, provinceState, postalZipCode, apartment, altFormat);
  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...restProps}>
      {formattedAddress}
    </address>
  );
}
