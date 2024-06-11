import type { ComponentProps } from 'react';

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

function formatAddress(address: string, city: string, country: string, provinceState?: string, postalZipCode?: string, apartment?: string, altFormat?: boolean) {
  const formattedAddress = apartment ? (/^[a-z\d]+$/i.test(apartment) ? `${apartment}-${address}` : `${address} ${apartment}`) : address;

  // prettier-ignore
  const lines = [
    formattedAddress,
    `${city}${provinceState ? ` ${provinceState}` : ''}${postalZipCode ? `  ${postalZipCode}` : ''}`,
    `${country}`
  ];

  // prettier-ignore
  const linesAlt = [
    formattedAddress,
    `${city}${provinceState ? `, ${provinceState}` : ''}`,
    `${postalZipCode ? `${postalZipCode}` : ''}`,
    `${country}`
  ];

  return (altFormat ? linesAlt : lines)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function Address(props: AddressProps) {
  const { address, city, provinceState, postalZipCode, country, className, altFormat, apartment, ...restProps } = props;
  const formattedAddress = formatAddress(address, city, country, provinceState, postalZipCode, apartment, altFormat);

  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...restProps}>
      {formattedAddress}
    </address>
  );
}
