import type { ComponentProps } from 'react';

import clsx from 'clsx';

export interface AddressProps extends ComponentProps<'address'> {
  address: string;
  city: string;
  provinceState?: string;
  postalZipCode?: string;
  country: string;
}

function formatAddress(address: string, city: string, country: string, provinceState?: string, postalZipCode?: string) {
  // TODO 'canada' shouldn't be hardcoded as we may deal with different values of the country field such as abbreviations
  const isNotCanadianAddress = 'canada' !== country.toLowerCase();

  // prettier-ignore
  const lines = [`${address}`, 
    `${city}${provinceState ? ` ${provinceState}` : ''}${postalZipCode ? `  ${postalZipCode}` : ''}`, 
    `${isNotCanadianAddress ? country : ''}`];

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function Address(props: AddressProps) {
  const { address, city, provinceState, postalZipCode, country, className, ...restProps } = props;
  const formattedAddress = formatAddress(address, city, country, provinceState, postalZipCode);

  return (
    <address className={clsx('mb-0 whitespace-pre-wrap', className)} data-testid="address-id" {...restProps}>
      {formattedAddress}
    </address>
  );
}
