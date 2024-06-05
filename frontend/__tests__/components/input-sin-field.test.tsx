import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputSinField } from '~/components/input-sin-field';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('InputSinField', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it.each([
    ['800000002', '800 000 002'],
    ['800 000 002', '800 000 002'],
    ['800-000-002', '800 000 002'],
    ['800 000-002', '800 000 002'],
    ['800000 002', '800 000 002'],
    ['800000-002', '800 000 002'],
  ])('should render %s -> %s', (sin, expected) => {
    render(<InputSinField id="test-id" name="test" label="label test" defaultValue={sin} />);

    const actual: HTMLInputElement = screen.getByTestId('input-sin-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue(expected);
    expect(actual).not.toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with help message', () => {
    const sin = '800000002';
    render(<InputSinField id="test-id" name="test" label="label test" defaultValue={sin} helpMessageSecondary="help message" />);

    const actual = screen.getByTestId('input-sin-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleDescription('help message');
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue('800 000 002');
    expect(actual).not.toBeRequired();
  });

  it('should render with required', () => {
    const sin = '800000002';
    render(<InputSinField id="test-id" name="test" label="label test" defaultValue={sin} required />);

    const actual = screen.getByTestId('input-sin-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue('800 000 002');
    expect(actual).toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with error message', () => {
    const sin = '800000002';
    render(<InputSinField id="test-id" name="test" label="label test" defaultValue={sin} errorMessage="error message" />);

    const actual = screen.getByTestId('input-sin-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toBeInvalid();
    expect(actual).toHaveAccessibleErrorMessage('error message');
  });
});
