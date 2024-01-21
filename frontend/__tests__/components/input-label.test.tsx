import { getByTestId, render, screen } from '@testing-library/react';

//import { axe, toHaveNoViolations } from 'jest-axe';
import { InputLabel } from '~/components/input-label';

//expect.extend(toHaveNoViolations);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('InputLabel', async () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    render(<InputLabel id="input-label">input label</InputLabel>);

    const actualLabel = screen.getByTestId('input-label');
    expect(actualLabel).toBeInTheDocument();
    expect(actualLabel.id).toBe('input-label');

    expect(() => getByTestId(actualLabel, 'input-label-required')).toThrow();
    expect(() => getByTestId(actualLabel, 'input-label-error-message')).toThrow();
  });

  it('should render with required text', () => {
    render(
      <InputLabel id="input-label" required>
        input label
      </InputLabel>,
    );

    const actualLabel = screen.getByTestId('input-label');
    expect(actualLabel).toBeInTheDocument();

    const actualRequired = getByTestId(actualLabel, 'input-label-required');
    expect(actualRequired.textContent).toBe(' (input-label.required)');

    expect(() => getByTestId(actualLabel, 'input-label-error-message')).toThrow();
  });

  it('should render with error message', () => {
    render(
      <InputLabel id="input-label" errorMessage="error message">
        input label
      </InputLabel>,
    );

    const actualLabel = screen.getByTestId('input-label');
    expect(actualLabel).toBeInTheDocument();

    const actualErrorMessage = getByTestId(actualLabel, 'input-label-error-message');
    expect(actualErrorMessage).toBeInTheDocument();
    expect(actualErrorMessage.textContent).toBe('error message');

    expect(() => getByTestId(actualLabel, 'input-label-required')).toThrow();
  });
});
