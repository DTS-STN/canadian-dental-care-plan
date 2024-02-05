import type { ComponentProps } from 'react';

import clsx from 'clsx';

export interface AddressProps extends ComponentProps<'address'> {
  address: string;
  city: string;
  provinceState?: string;
  postalZipCode?: string;
  country: string;
}

function formatAddress({ address, city, provinceState, postalZipCode, country }: AddressProps): string {
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
  const { className, ...restProps } = props;
  const formattedAddress = formatAddress(props);

  return (
    <address className={clsx('mb-0 whitespace-pre-wrap', className)} data-testid="address-id" {...restProps}>
      {formattedAddress}
    </address>
  );
}
