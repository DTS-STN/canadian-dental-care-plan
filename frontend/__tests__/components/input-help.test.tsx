import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputHelp } from '~/components/input-help';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('InputHelp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    render(<InputHelp id="id">input help</InputHelp>);

    const actualLabel = screen.getByTestId('input-help');
    expect(actualLabel).toBeInTheDocument();
    expect(actualLabel).toHaveAttribute('id', 'id');
    expect(actualLabel).toHaveTextContent('input help');
  });
});
