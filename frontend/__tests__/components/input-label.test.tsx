import { getByTestId, render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it } from 'vitest';

import { InputLabel } from '~/components/input-label';

//import { axe, toHaveNoViolations } from 'jest-axe';
//expect.extend(toHaveNoViolations);

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
    render(<InputLabel id="id">input label</InputLabel>);

    const actualLabel = screen.getByTestId('input-label-id');
    expect(actualLabel).toBeInTheDocument();
    expect(actualLabel.id).toBe('id');

    expect(() => getByTestId(actualLabel, 'input-label-required-id')).toThrow();
    expect(() => getByTestId(actualLabel, 'input-label-error-message-id')).toThrow();
  });

  it('should render with required text', () => {
    render(
      <InputLabel id="id" required>
        input label
      </InputLabel>,
    );

    const actualLabel = screen.getByTestId('input-label-id');
    expect(actualLabel).toBeInTheDocument();

    const actualRequired = getByTestId(actualLabel, 'input-label-required-id');
    expect(actualRequired.textContent).toBe('(input-label.required)');

    expect(() => getByTestId(actualLabel, 'input-label-error-message-id')).toThrow();
  });

  it('should render with error message', () => {
    render(
      <InputLabel id="id" errorMessage="error message">
        input label
      </InputLabel>,
    );

    const actualLabel = screen.getByTestId('input-label-id');
    expect(actualLabel).toBeInTheDocument();

    const actualErrorMessage = getByTestId(actualLabel, 'input-label-error-message-id');
    expect(actualErrorMessage).toBeInTheDocument();
    expect(actualErrorMessage.textContent).toBe('error message');

    expect(() => getByTestId(actualLabel, 'input-label-required')).toThrow();
  });
});
