import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputField } from '~/components/input-field';

describe('InputField', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should render', () => {
    render(<InputField id="test-id" data-testid="input-field" name="test" label="label test" defaultValue="default value" />);

    const actual: HTMLInputElement = screen.getByTestId('input-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue('default value');
    expect(actual).not.toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with help message', () => {
    render(<InputField id="test-id" data-testid="input-field" name="test" label="label test" defaultValue="default value" helpMessageSecondary="help message" />);

    const actual = screen.getByTestId('input-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleDescription('help message');
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue('default value');
    expect(actual).not.toBeRequired();
  });

  it('should render with required', () => {
    render(<InputField id="test-id" data-testid="input-field" name="test" label="label test" defaultValue="default value" required />);

    const actual = screen.getByTestId('input-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue('default value');
    expect(actual).toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with error message', () => {
    render(<InputField id="test-id" data-testid="input-field" name="test" label="label test" defaultValue="default value" errorMessage="error message" />);

    const actual = screen.getByTestId('input-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toBeInvalid();
    expect(actual).toHaveAccessibleErrorMessage('error message');
  });
});
