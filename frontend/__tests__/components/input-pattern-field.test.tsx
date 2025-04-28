import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputPatternField } from '~/components/input-pattern-field';

describe('InputPatternField', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const testFormat = '### ### ###';

  it.each([
    ['800000002', '800 000 002'],
    ['800 000 002', '800 000 002'],
    ['800-000-002', '800 000 002'],
    ['800 000-002', '800 000 002'],
    ['800000 002', '800 000 002'],
    ['800000-002', '800 000 002'],
  ])('should render %s -> %s', (defaultValue, expected) => {
    render(<InputPatternField id="test-id" data-testid="input-pattern-field" name="test" label="label test" defaultValue={defaultValue} format={testFormat} />);

    const actual: HTMLInputElement = screen.getByTestId('input-pattern-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue(expected);
    expect(actual).not.toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with help message', () => {
    render(<InputPatternField id="test-id" data-testid="input-pattern-field" name="test" label="label test" format={testFormat} defaultValue="800000002" helpMessageSecondary="help message" />);

    const actual = screen.getByTestId('input-pattern-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleDescription('help message');
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue('800 000 002');
    expect(actual).not.toBeRequired();
  });

  it('should render with required', () => {
    render(<InputPatternField id="test-id" data-testid="input-pattern-field" name="test" label="label test" format={testFormat} defaultValue="800000002" required />);

    const actual = screen.getByTestId('input-pattern-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAttribute('id', 'test-id');
    expect(actual).toHaveValue('800 000 002');
    expect(actual).toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with error message', () => {
    render(<InputPatternField id="test-id" data-testid="input-pattern-field" name="test" label="label test" format={testFormat} defaultValue="800000002" errorMessage="error message" />);

    const actual = screen.getByTestId('input-pattern-field');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toBeInvalid();
    expect(actual).toHaveAccessibleErrorMessage('error message');
  });
});
