import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { Banner } from '~/components/banner';

describe('Banner', () => {
  it('should render the Banner', () => {
    render(<Banner data-testid="banner-id" alert="test" description="test" />);
    const actual = screen.getByTestId('banner-id');
    expect(actual).toBeInTheDocument();
  });
});
