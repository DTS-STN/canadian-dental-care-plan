import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputPhoneField } from '~/components/input-phone-field';

describe('InputPhoneField', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should render', () => {
    const phoneNumber = '+15146667777';
    render(<InputPhoneField id="id" data-testid="test-id" name="test" label="label test" defaultValue={phoneNumber} />);

    const actual: HTMLInputElement = screen.getByTestId('test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'id');
    expect(actual).toHaveValue('(514) 666-7777');
    expect(actual).not.toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render international phone number', () => {
    const phoneNumber = '+50644444444';
    render(<InputPhoneField id="id" data-testid="test-id" name="test" label="label test" defaultValue={phoneNumber} />);

    const actual: HTMLInputElement = screen.getByTestId('test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'id');
    expect(actual).toHaveValue('+506 4444 4444');
    expect(actual).not.toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with help message', () => {
    const phoneNumber = '+15146667777';
    render(<InputPhoneField id="id" data-testid="test-id" name="test" label="label test" defaultValue={phoneNumber} helpMessageSecondary="help message" />);

    const actual = screen.getByTestId('test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleDescription('help message');
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'id');
    expect(actual).toHaveValue('(514) 666-7777');
    expect(actual).not.toBeRequired();
  });

  it('should render with required', () => {
    const phoneNumber = '+15146667777';
    render(<InputPhoneField id="id" data-testid="test-id" name="test" label="label test" defaultValue={phoneNumber} required />);

    const actual = screen.getByTestId('test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAttribute('id', 'id');
    expect(actual).toHaveValue('(514) 666-7777');
    expect(actual).toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with error message', () => {
    const phoneNumber = '+15146667777';
    render(<InputPhoneField id="id" data-testid="test-id" name="test" label="label test" defaultValue={phoneNumber} errorMessage="error message" />);

    const actual = screen.getByTestId('test-id');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toBeInvalid();
    expect(actual).toHaveAccessibleErrorMessage('error message');
  });
});
