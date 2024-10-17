import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { AddressDiff } from '~/components/address-diff';

describe('AddressDiff', () => {
  it('should render the component', () => {
    const oldAddress = {
      address: '123 Main St',
      city: 'Anytown',
      provinceState: 'ON',
      postalZipCode: 'K1A 0B1',
      country: 'Canada',
      apartment: 'Apt 4',
    };

    const newAddress = {
      address: '456 Oak Ave',
      city: 'Otherville',
      provinceState: 'QC',
      postalZipCode: 'H2B 2C3',
      country: 'Canada',
      apartment: 'Unit 5',
    };

    const { container } = render(<AddressDiff oldAddress={oldAddress} newAddress={newAddress} />);
    expect(container).toMatchSnapshot();
  });

  it('should render the component with an alternate format', () => {
    const oldAddress = {
      address: '123 Main St',
      city: 'Anytown',
      provinceState: 'ON',
      postalZipCode: 'K1A 0B1',
      country: 'Canada',
      apartment: 'Apt 4',
    };

    const newAddress = {
      address: '456 Oak Ave',
      city: 'Otherville',
      provinceState: 'QC',
      postalZipCode: 'H2B 2C3',
      country: 'Canada',
      apartment: 'Unit 5',
    };

    const { container } = render(<AddressDiff oldAddress={oldAddress} newAddress={newAddress} altFormat />);
    expect(container).toMatchSnapshot();
  });
});
