import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it } from 'vitest';

import { InputField } from '~/components/input-field';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('InputLabel', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should render', async () => {
    render(<InputField id="id" name="test" label="label" defaultValue="default value" />);

    const actual = screen.getByTestId('data-test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).not.toBeRequired();
    expect(actual).toHaveAccessibleName('label');
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with help message', async () => {
    render(<InputField id="id" name="test" label="label" defaultValue="default value" helpMessage="help message" />);

    const actual = screen.getByTestId('data-test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).not.toBeRequired();
    expect(actual).toHaveAccessibleName('label');
    expect(actual).toHaveAccessibleDescription('help message');
  });

  it('should render with help message secondary', async () => {
    render(<InputField id="id" name="test" label="label" defaultValue="default value" helpMessageSecondary="help message secondary" />);

    const actual = screen.getByTestId('data-test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).not.toBeRequired();
    expect(actual).toHaveAccessibleName('label');
    expect(actual).toHaveAccessibleDescription('help message secondary');
  });

  it('should render with required', async () => {
    render(<InputField id="id" name="test" label="label" defaultValue="default value" required />);

    const actual = screen.getByTestId('data-test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label (input-label.required)');
    expect(actual).toBeRequired();
  });

  it('should render with error message', async () => {
    render(<InputField id="id" name="test" label="label" defaultValue="default value" errorMessage="error message" />);

    const actual = screen.getByTestId('data-test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label error message');
    expect(actual).toBeInvalid();
    expect(actual).toHaveAccessibleErrorMessage();
  });
});
