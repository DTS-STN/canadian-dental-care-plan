import { render } from '@testing-library/react';

import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageFooter } from '~/components/page-footer';

describe('PageFooter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const { container } = render(<PageFooter />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
