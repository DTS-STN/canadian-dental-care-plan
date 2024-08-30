import { render } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InputCheckboxesProps } from '~/components/input-checkboxes';
import { InputCheckboxes } from '~/components/input-checkboxes';

describe('InputCheckboxes', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const options: InputCheckboxesProps['options'] = [
    { children: 'Option 1', value: 'option1' },
    { children: 'Option 2', value: 'option2' },
  ];

  it('renders component with legend and options', () => {
    const { getByText } = render(<InputCheckboxes id="test" legend="Test Legend" name="test" options={options} />);

    expect(getByText('Test Legend')).toBeInTheDocument();
    expect(getByText('Option 1')).toBeInTheDocument();
    expect(getByText('Option 2')).toBeInTheDocument();
  });

  it('displays error message', () => {
    const { getByText } = render(<InputCheckboxes id="test" legend="Test Legend" name="test" options={options} errorMessage="Test Error Message" />);
    expect(getByText('Test Error Message')).toBeInTheDocument();
  });

  it('displays helpMessagePrimary', () => {
    const { getByText } = render(<InputCheckboxes id="test" legend="Test Legend" name="test" options={options} helpMessagePrimary="Primary help message" />);
    expect(getByText('Primary help message')).toBeInTheDocument();
  });

  it('displays helpMessageSecondary', () => {
    const { getByText } = render(<InputCheckboxes id="test" legend="Test Legend" name="test" options={options} helpMessageSecondary="Secondary help message" />);
    expect(getByText('Secondary help message')).toBeInTheDocument();
  });
});
