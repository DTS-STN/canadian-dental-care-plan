import { render } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import { ButtonEndIcon, ButtonStartIcon } from '~/components/button-icons';

// Mock FontAwesomeIcon to avoid rendering actual icons in tests
vi.mock('@fortawesome/react-fontawesome', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FontAwesomeIcon: ({ className, icon, ...props }: any) => (
    <div className={className} {...props}>
      {JSON.stringify(icon)}
    </div>
  ),
}));

describe('ButtonStartIcon', () => {
  it('should render FontAwesomeIcon with the correct classes', () => {
    const { container } = render(<ButtonStartIcon icon="spinner" className="custom-class" />);
    const icon = container.querySelector('div');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('me-3 block size-4 custom-class');
    expect(icon).toHaveTextContent('spinner');
  });

  it('should pass additional props to FontAwesomeIcon', () => {
    const { container } = render(<ButtonStartIcon icon="spinner" aria-label="start-icon" />);
    const icon = container.querySelector('div');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-label', 'start-icon');
    expect(icon).toHaveTextContent('spinner');
  });
});

describe('ButtonEndIcon', () => {
  it('should render FontAwesomeIcon with the correct classes', () => {
    const { container } = render(<ButtonEndIcon icon="spinner" className="custom-class" />);
    const icon = container.querySelector('div');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('ms-3 block size-4 custom-class');
    expect(icon).toHaveTextContent('spinner');
  });

  it('should pass additional props to FontAwesomeIcon', () => {
    const { container } = render(<ButtonEndIcon icon="spinner" aria-label="end-icon" />);
    const icon = container.querySelector('div');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-label', 'end-icon');
    expect(icon).toHaveTextContent('spinner');
  });
});
