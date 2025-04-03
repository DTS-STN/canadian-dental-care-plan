import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputSanitizeField } from '~/components/input-sanitize-field';

describe('InputSanitizeField', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it.each([
    ["Hi, my name is Smith's.", "Hi, my name is Smith's."],
    ['Hi, my name is Smith’s.', 'Hi, my name is Smith’s.'],
    ['Hello!', 'Hello'],
    ['Good@Morning', 'GoodMorning'],
    ['123#456', '123456'],
    ['Welcome*Home', 'WelcomeHome'],
    ['800--000-----000', '800-000-000'],
  ])('should render %s -> %s', (defaultValue, expected) => {
    render(<InputSanitizeField id="test-id" name="test" label="label test" defaultValue={defaultValue} />);

    const actual: HTMLInputElement = screen.getByTestId('input-sanitize-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue(expected);
    expect(actual).not.toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with help message', () => {
    const defaultValue = "Hi, my name is Smith's.";
    render(<InputSanitizeField id="test-id" name="test" label="label test" defaultValue={defaultValue} helpMessageSecondary="help message" />);

    const actual = screen.getByTestId('input-sanitize-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleDescription('help message');
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue("Hi, my name is Smith's.");
    expect(actual).not.toBeRequired();
  });

  it('should render with required', () => {
    const defaultValue = "Hi, my name is Smith's.";
    render(<InputSanitizeField id="test-id" name="test" label="label test" defaultValue={defaultValue} required />);

    const actual = screen.getByTestId('input-sanitize-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue("Hi, my name is Smith's.");
    expect(actual).toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with error message', () => {
    const defaultValue = "Hi, my name is Smith's.";
    render(<InputSanitizeField id="test-id" name="test" label="label test" defaultValue={defaultValue} errorMessage="error message" />);

    const actual = screen.getByTestId('input-sanitize-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toBeInvalid();
    expect(actual).toHaveAccessibleErrorMessage('error message');
  });
});
