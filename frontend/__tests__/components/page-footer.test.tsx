import { render } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageFooter } from '~/components/page-footer';

describe('PageFooter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <PageFooter />,
        path: '/',
      },
    ]);
    const { container } = render(<RemixStub />);
    expect(container).toBeDefined();
  });
});
