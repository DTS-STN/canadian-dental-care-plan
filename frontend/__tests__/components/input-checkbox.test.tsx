import { fireEvent, render } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputCheckbox } from '~/components/input-checkbox';

describe('InputCheckbox', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('renders checkbox with label and appends content', () => {
    const labelText = 'Checkbox Label';
    const appendContent = <div data-testid="append-content">Appended Content</div>;
    const { getByLabelText, getByTestId } = render(
      <InputCheckbox id="test-checkbox" data-testid="input-checkbox" name="test-checkbox" append={appendContent}>
        {labelText}
      </InputCheckbox>,
    );

    // Check if checkbox and label are rendered correctly
    const checkbox = getByTestId('input-checkbox');
    const label = getByLabelText(labelText);
    expect(checkbox).toBeInTheDocument();
    expect(label).toBeInTheDocument();

    // Check if appended content is rendered
    const appendedContent = getByTestId('append-content');
    expect(appendedContent).toBeInTheDocument();
  });

  it('fires onChange event when checkbox is clicked', () => {
    const onChangeMock = vi.fn();
    const { getByTestId } = render(
      <InputCheckbox id="test-checkbox" data-testid="input-checkbox" name="test-checkbox" onChange={onChangeMock}>
        Checkbox Label
      </InputCheckbox>,
    );

    const checkbox = getByTestId('input-checkbox');
    fireEvent.click(checkbox);
    expect(onChangeMock).toHaveBeenCalledOnce();
  });

  it('disables checkbox when disabled prop is provided', () => {
    const { getByTestId } = render(
      <InputCheckbox id="test-checkbox" data-testid="input-checkbox" name="test-checkbox" disabled>
        Checkbox Label
      </InputCheckbox>,
    );

    const checkbox = getByTestId('input-checkbox');
    expect(checkbox).toBeDisabled();
  });
});
