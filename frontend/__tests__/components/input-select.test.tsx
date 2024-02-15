import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { InputSelect } from '~/components/input-select';

describe('InputSelect', () => {
  it('should render', async () => {
    render(
      <InputSelect
        id="some-id"
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

  it('should render with help message', async () => {
    render(
      <InputSelect
        id="some-id"
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

  it('should render with required', async () => {
    render(
      <InputSelect
        id="some-id"
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
    expect(actual).toHaveAccessibleName('label test (input-label.required)');
    expect(actual).toHaveAttribute('id', 'some-id');
    expect(actual).toHaveValue('first');
    expect(actual).toBeRequired();
    expect(actual).not.toHaveAccessibleDescription();
  });

  it('should render with error message', async () => {
    render(
      <InputSelect
        id="some-id"
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
