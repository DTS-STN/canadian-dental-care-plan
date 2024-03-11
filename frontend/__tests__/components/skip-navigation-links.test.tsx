import { fireEvent, render } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SkipNavigationLinks } from '~/components/skip-navigation-links';
import { scrollAndFocusFromAnchorLink } from '~/utils/link-utils';

vi.mock('~/utils/link-utils', () => ({
  scrollAndFocusFromAnchorLink: vi.fn(),
}));

describe('SkipNavigationLinks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <SkipNavigationLinks />,
        path: '/',
      },
    ]);
    render(<RemixStub />);
  });

  it('renders skip links', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <SkipNavigationLinks />,
        path: '/',
      },
    ]);
    const { getByText } = render(<RemixStub />);
    expect(getByText('gcweb:nav.skip-to-content')).toBeInTheDocument();
    expect(getByText('gcweb:nav.skip-to-about')).toBeInTheDocument();
  });

  it('calls scrollAndFocusFromAnchorLink when skip link is clicked', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <SkipNavigationLinks />,
        path: '/',
      },
    ]);
    const { getByText } = render(<RemixStub />);
    const skipToContentButton = getByText('gcweb:nav.skip-to-content');
    fireEvent.click(skipToContentButton);
    expect(scrollAndFocusFromAnchorLink).toHaveBeenCalled();
  });
});
