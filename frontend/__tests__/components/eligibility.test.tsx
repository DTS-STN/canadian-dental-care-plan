import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { Eligibility } from '~/components/eligibility';

describe('Eligibility', () => {
  it('should render eligible status', () => {
    const { container } = render(<Eligibility type="eligible" />);
    expect(container).toMatchSnapshot();
  });

  it('should render ineligible status', () => {
    const { container } = render(<Eligibility type="ineligible" />);
    expect(container).toMatchSnapshot();
  });

  it('should render eligible-proof status', () => {
    const { container } = render(<Eligibility type="eligible-proof" />);
    expect(container).toMatchSnapshot();
  });
});
