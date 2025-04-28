import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputLabel } from '~/components/input-label';

describe('InputLabel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    render(
      <InputLabel id="id" data-testid="input-label">
        input test
      </InputLabel>,
    );

    const actualLabel = screen.getByTestId('input-label');
    expect(actualLabel).toBeInTheDocument();
    expect(actualLabel).toHaveAttribute('id', 'id');
    expect(actualLabel).toHaveTextContent('input test');
  });
});
