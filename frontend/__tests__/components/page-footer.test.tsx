import { render } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageFooter } from '~/components/page-footer';

expect.extend(toHaveNoViolations);

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
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
