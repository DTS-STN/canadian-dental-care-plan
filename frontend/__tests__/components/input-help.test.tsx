import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputHelp } from '~/components/input-help';

describe('InputHelp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    render(
      <InputHelp id="id" data-testid="input-help">
        input help
      </InputHelp>,
    );

    const actualLabel = screen.getByTestId('input-help');
    expect(actualLabel).toBeInTheDocument();
    expect(actualLabel).toHaveAttribute('id', 'id');
    expect(actualLabel).toHaveTextContent('input help');
  });
});
