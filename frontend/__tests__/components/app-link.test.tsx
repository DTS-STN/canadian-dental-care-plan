import { render, screen } from '@testing-library/react';

import { useHref } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppLink } from '~/components/app-link';
import type { AppLinkProps } from '~/components/app-link';
import { getPathById } from '~/utils/route-utils';

vi.mock('react-router', () => ({
  Link: vi.fn(({ children }) => <a href="https://www.example.com">{children}</a>),
  useHref: vi.fn((to) => to),
}));

vi.mock('~/utils/route-utils', () => ({
  getPathById: vi.fn((routeId, params) => `/mock-path/${routeId}/${params?.lang ?? ''}`),
}));

describe('AppLink', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const defaultProps: AppLinkProps = {
    children: 'Click me',
    routeId: 'test-route',
  };

  it('should render correctly', () => {
    render(<AppLink {...defaultProps} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should resolve the `to` prop using getPathById when `routeId` is provided', () => {
    render(<AppLink {...defaultProps} />);
    expect(useHref).toHaveBeenCalledWith('/mock-path/test-route/', { relative: 'route' });
  });

  it('should render an external link correctly', () => {
    const externalProps: AppLinkProps = { ...defaultProps, to: 'https://www.example.com' };
    render(<AppLink {...externalProps} />);
    expect(screen.getByText('Click me').closest('a')).toHaveAttribute('href', 'https://www.example.com');
  });

  it('should render the NewTabIndicator when newTabIndicator is true', () => {
    const propsWithIndicator: AppLinkProps = { ...defaultProps, newTabIndicator: true };
    render(<AppLink {...propsWithIndicator} />);
    expect(screen.getByText('(screen-reader.new-tab)')).toBeInTheDocument();
  });

  it('should call getPathById with the correct arguments', () => {
    const params = { lang: 'en' };
    render(<AppLink {...defaultProps} params={params} />);
    expect(getPathById).toHaveBeenCalledWith('test-route', { lang: 'en' });
  });
});
