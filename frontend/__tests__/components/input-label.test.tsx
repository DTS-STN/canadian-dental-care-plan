import { getByTestId, render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputLabel } from '~/components/input-label';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('InputLabel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    render(<InputLabel id="id">input test</InputLabel>);

    const actualLabel = screen.getByTestId('input-label');
    expect(actualLabel).toBeInTheDocument();
    expect(actualLabel).toHaveAttribute('id', 'id');
    expect(actualLabel).toHaveTextContent('input test');

    expect(() => getByTestId(actualLabel, 'input-label-required')).toThrow();
  });

  it('should render with required', () => {
    render(
      <InputLabel id="id" required>
        input test
      </InputLabel>,
    );

    const actualLabel = screen.getByTestId('input-label');
    expect(actualLabel).toBeInTheDocument();
    expect(actualLabel).toHaveAttribute('id', 'id');
    expect(actualLabel).toHaveTextContent('input test');

    const actualRequired = getByTestId(actualLabel, 'input-label-required');
    expect(actualRequired).toHaveTextContent('(input-label.required)');
  });
});
