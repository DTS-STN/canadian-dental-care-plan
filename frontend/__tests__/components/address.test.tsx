import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { Address } from '~/components/address';

describe('Address', () => {
  it('should render apartment with hypen at beginning of address if apartment number is a chunk of alphanumeric chars', () => {
    render(<Address address={{ address: '123 Fake Street', apartment: '123', city: 'Beverly Hills', country: 'USA', postalZipCode: '90210', provinceState: 'CA' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123-123 Fake Street\nBeverly Hills CA  90210\nUSA');
  });

  it('should render apartment at end of address if apartment number is not a chunk of alphanumeric chars', () => {
    render(<Address address={{ address: '123 Fake Street', city: 'Beverly Hills', provinceState: 'CA', postalZipCode: '90210', country: 'USA', apartment: 'Apt 123' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123 Fake Street Apt 123\nBeverly Hills CA  90210\nUSA');
  });

  it('should render apartment with hypen at beginning if there is no space in the apartment number', () => {
    render(<Address address={{ address: '123 Fake Street', city: 'Beverly Hills', provinceState: 'CA', postalZipCode: '90210', country: 'USA', apartment: '123' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123-123 Fake Street\nBeverly Hills CA  90210\nUSA');
  });

  it('should render country when not a Canadian address', () => {
    render(<Address address={{ address: '123 Fake Street', city: 'Beverly Hills', provinceState: 'CA', postalZipCode: '90210', country: 'USA', apartment: '123' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123-123 Fake Street\nBeverly Hills CA  90210\nUSA');
  });

  it('should not render apartment number when it is undefined', () => {
    render(<Address address={{ address: '123 Fake Street', city: 'Beverly Hills', provinceState: 'CA', postalZipCode: '90210', country: 'USA' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123 Fake Street\nBeverly Hills CA  90210\nUSA');
  });

  it('should not render country when address is Canadian', () => {
    render(<Address address={{ address: '123 Fake Street', city: 'Ottawa', provinceState: 'ON', postalZipCode: 'K2K 2K2', country: 'Canada' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123 Fake Street\nOttawa ON  K2K 2K2\nCanada');
  });

  it('should render apartment number if supplied and not render country when address is Canadian', () => {
    render(<Address address={{ address: '123 Fake Street', city: 'Ottawa', provinceState: 'ON', postalZipCode: 'K2K 2K2', country: 'Canada', apartment: '123' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123-123 Fake Street\nOttawa ON  K2K 2K2\nCanada');
  });

  it('should render apartment number if supplied and not render country when address is Canadian', () => {
    render(<Address address={{ address: '123 Fake Street', city: 'Ottawa', provinceState: 'ON', postalZipCode: 'K2K 2K2', country: 'Canada', apartment: '123' }} />);
    const actual = screen.getByTestId('address-id');
    expect(actual.textContent).toBe('123-123 Fake Street\nOttawa ON  K2K 2K2\nCanada');
  });
});
