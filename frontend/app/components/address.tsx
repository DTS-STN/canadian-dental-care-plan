import type { ComponentProps } from 'react';

import { cn } from '~/utils/tw-utils';

export interface AddressProps extends ComponentProps<'address'> {
  address: string;
  city: string;
  provinceState?: string;
  postalZipCode?: string;
  country: string;
  altFormat?: boolean;
}

function formatAddress(address: string, city: string, country: string, provinceState?: string, postalZipCode?: string, altFormat?: boolean) {
  // TODO 'canada' shouldn't be hardcoded as we may deal with different values of the country field such as abbreviations
  const isNotCanadianAddress = 'canada' !== country.toLowerCase();

  // prettier-ignore
  const lines = [`${address}`,
    `${city}${provinceState ? ` ${provinceState}` : ''}${postalZipCode ? `  ${postalZipCode}` : ''}`,
    `${isNotCanadianAddress ? country : ''}`];

  // prettier-ignore
  const linesAlt = [`${address}`,
  `${city}${provinceState ? ` ${provinceState}` : ''}`,
  `${postalZipCode ? `${postalZipCode}` : ''}`,
  `${isNotCanadianAddress ? country : ''}`];

  return (altFormat ? linesAlt : lines)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function Address(props: AddressProps) {
  const { address, city, provinceState, postalZipCode, country, className, altFormat, ...restProps } = props;
  const formattedAddress = formatAddress(address, city, country, provinceState, postalZipCode, altFormat);

  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-id" {...restProps}>
      {formattedAddress}
    </address>
  );
}
