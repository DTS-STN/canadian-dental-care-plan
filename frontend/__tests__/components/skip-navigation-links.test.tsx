import { fireEvent, render } from '@testing-library/react';

import { createRoutesStub } from 'react-router';

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

  it('renders skip links', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <SkipNavigationLinks />,
        path: '/',
      },
    ]);
    const { getByText } = render(<RoutesStub />);
    expect(getByText('gcweb:nav.skip-to-content')).toBeInTheDocument();
    expect(getByText('gcweb:nav.skip-to-about')).toBeInTheDocument();
  });

  it('calls scrollAndFocusFromAnchorLink when skip link is clicked', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <SkipNavigationLinks />,
        path: '/',
      },
    ]);
    const { getByText } = render(<RoutesStub />);
    const skipToContentButton = getByText('gcweb:nav.skip-to-content');
    fireEvent.click(skipToContentButton);
    expect(scrollAndFocusFromAnchorLink).toHaveBeenCalled();
  });
});
