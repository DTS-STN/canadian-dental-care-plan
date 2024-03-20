import { render } from '@testing-library/react';

import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { Progress } from '~/components/progress';

expect.extend(toHaveNoViolations);

describe('Progress component', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(<Progress />);
    const rootElement = getByTestId('progress-root');
    const indicatorElement = getByTestId('progress-indicator');

    expect(rootElement).toBeInTheDocument();
    expect(indicatorElement).toBeInTheDocument();
    expect(rootElement).toHaveClass('h-2.5'); // Default size
    expect(indicatorElement).toHaveClass('bg-gray-600'); // Default variant
  });

  it('renders with custom size and variant', () => {
    const { getByTestId } = render(<Progress size="lg" variant="blue" />);
    const rootElement = getByTestId('progress-root');
    const indicatorElement = getByTestId('progress-indicator');

    expect(rootElement).toBeInTheDocument();
    expect(indicatorElement).toBeInTheDocument();
    expect(rootElement).toHaveClass('h-4'); // Custom size
    expect(indicatorElement).toHaveClass('bg-blue-600'); // Custom variant
  });

  it('renders with custom value', () => {
    const { getByTestId } = render(<Progress value={50} />);
    const indicatorElement = getByTestId('progress-indicator');

    expect(indicatorElement).toBeInTheDocument();
    expect(indicatorElement).toHaveStyle('transform: translateX(-50%)');
  });

  it('renders with custom className', () => {
    const { getByTestId } = render(<Progress className="custom-class" />);
    const rootElement = getByTestId('progress-root');

    expect(rootElement).toBeInTheDocument();
    expect(rootElement).toHaveClass('custom-class');
  });

  // Add more tests as needed
});

describe('Progress component accessiblity', () => {
  it('renders with default props', async () => {
    const { container } = render(<Progress aria-label="File upload" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders with custom size and variant', async () => {
    const { container } = render(<Progress aria-label="File upload" size="lg" variant="blue" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders with custom value', async () => {
    const { container } = render(<Progress aria-label="File upload" value={50} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders with custom className', async () => {
    const { container } = render(<Progress aria-label="File upload" className="custom-class" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
