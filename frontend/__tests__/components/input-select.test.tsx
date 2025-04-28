import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { InputSelect } from '~/components/input-select';

describe('InputSelect', () => {
  it('should render', () => {
    render(
      <InputSelect
        id="some-id"
        data-testid="input-some-id-test"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
      />,
    );

    const actual: HTMLInputElement = screen.getByTestId('input-some-id-test');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'some-id');
    expect(actual).toHaveValue('first');
    expect(actual).not.toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with help message', () => {
    render(
      <InputSelect
        id="some-id"
        data-testid="input-some-id-test"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
        helpMessage="help message"
      />,
    );

    const actual = screen.getByTestId('input-some-id-test');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleDescription('help message');
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toHaveAttribute('id', 'some-id');
    expect(actual).toHaveValue('first');
    expect(actual).not.toBeRequired();
  });

  it('should render with required', () => {
    render(
      <InputSelect
        id="some-id"
        data-testid="input-some-id-test"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
        required
      />,
    );

    const actual = screen.getByTestId('input-some-id-test');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAttribute('id', 'some-id');
    expect(actual).toHaveValue('first');
    expect(actual).toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with error message', () => {
    render(
      <InputSelect
        id="some-id"
        data-testid="input-some-id-test"
        name="test"
        label="label test"
        defaultValue="first"
        options={[
          { children: 'first option', value: 'first' },
          { children: 'second option', value: 'second' },
        ]}
        errorMessage="error message"
      />,
    );

    const actual = screen.getByTestId('input-some-id-test');

    expect(actual).toBeInTheDocument();
    expect(actual).toHaveAccessibleName('label test');
    expect(actual).toBeInvalid();
    expect(actual).toHaveAccessibleErrorMessage('error message');
  });
});
