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
  /**
   * The format of the address
   *
   * - `standard`: The standard address format, with the address line, city, province/state, postal/zip code, and country.
   * - `alternative`: An alternative address format, with the address line, city, province/state, postal/zip code, and country on separate lines.
   */
  format?: 'standard' | 'alternative';
  newAddress: Address;
  oldAddress: Address;
}

export function AddressDiff({ format = 'standard', oldAddress, newAddress, className, ...restProps }: AddressDiffProps) {
  const formattedOldAddress = formatAddress({ ...oldAddress, format });
  const formattedNewAddress = formatAddress({ ...newAddress, format });
  return (
    <address className={cn('whitespace-pre-wrap not-italic', className)} data-testid="address-diff" {...restProps}>
      <DiffViewer oldStr={formattedOldAddress} newStr={formattedNewAddress} />
    </address>
  );
}
