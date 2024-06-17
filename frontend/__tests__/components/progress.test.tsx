import { render } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Progress } from '~/components/progress';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
  }),
}));

describe('Progress component', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('renders with default props', () => {
    const { getByTestId } = render(<Progress label="test" value={0} />);
    const rootElement = getByTestId('progress-root');
    const indicatorElement = getByTestId('progress-indicator');

    expect(rootElement).toBeInTheDocument();
    expect(indicatorElement).toBeInTheDocument();
    expect(rootElement).toHaveClass('h-2.5'); // Default size
    expect(indicatorElement).toHaveClass('bg-gray-600'); // Default variant
  });

  it('renders with custom size and variant', () => {
    const { getByTestId } = render(<Progress size="lg" variant="blue" label="test" value={0} />);
    const rootElement = getByTestId('progress-root');
    const indicatorElement = getByTestId('progress-indicator');

    expect(rootElement).toBeInTheDocument();
    expect(indicatorElement).toBeInTheDocument();
    expect(rootElement).toHaveClass('h-4'); // Custom size
    expect(indicatorElement).toHaveClass('bg-blue-600'); // Custom variant
  });

  it('renders with custom value', () => {
    const { getByTestId } = render(<Progress value={50} label="test" />);
    const indicatorElement = getByTestId('progress-indicator');

    expect(indicatorElement).toBeInTheDocument();
    expect(indicatorElement).toHaveStyle('transform: translateX(-50%)');
  });

  it('renders with custom className', () => {
    const { getByTestId } = render(<Progress className="custom-class" label="test" value={0} />);
    const rootElement = getByTestId('progress-root');

    expect(rootElement).toBeInTheDocument();
    expect(rootElement).toHaveClass('custom-class');
  });

  // Add more tests as needed
});
