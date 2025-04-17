import { fireEvent, render } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputRadio } from '~/components/input-radio';

describe('InputRadio', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('renders radio button with label and appends content', () => {
    const labelText = 'Radio Label';
    const appendContent = <div data-testid="append-content">Appended Content</div>;
    const { getByLabelText, getByTestId } = render(
      <InputRadio id="test" name="test" append={appendContent}>
        {labelText}
      </InputRadio>,
    );

    // Check if radio button and label are rendered correctly
    const radioButton = getByTestId('input-radio-test');
    const label = getByLabelText(labelText);
    expect(radioButton).toBeInTheDocument();
    expect(label).toBeInTheDocument();

    // Check if appended content is rendered
    const appendedContent = getByTestId('append-content');
    expect(appendedContent).toBeInTheDocument();
  });

  it('fires onChange event when radio button is clicked', () => {
    const onChangeMock = vi.fn();
    const { getByTestId } = render(
      <InputRadio id="test" name="test" onChange={onChangeMock}>
        Radio Label
      </InputRadio>,
    );

    const radioButton = getByTestId('input-radio-test');
    fireEvent.click(radioButton);
    expect(onChangeMock).toHaveBeenCalledOnce();
  });

  it('disables radio button when disabled prop is provided', () => {
    const { getByTestId } = render(
      <InputRadio id="test" name="test" disabled>
        Radio Label
      </InputRadio>,
    );

    const radioButton = getByTestId('input-radio-test');
    expect(radioButton).toBeDisabled();
  });
});
