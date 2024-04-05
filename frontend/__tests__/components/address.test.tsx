import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { Address } from '~/components/address';

describe('Address', () => {
  it('should render country when not a Canadian address', async () => {
    render(<Address address="123 Fake Street" city="Beverly Hills" provinceState="CA" postalZipCode="90210" country="USA" />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123 Fake Street\nBeverly Hills CA  90210\nUSA');
  });

  it('should not render country when address is Canadian', async () => {
    render(<Address address="123 Fake Street" city="Ottawa" provinceState="ON" postalZipCode="K2K 2K2" country="Canada" />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123 Fake Street\nOttawa ON  K2K 2K2');
  });
});
