import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { StatusTag } from '~/components/status-tag';

describe('StatusTag', () => {
  it('should render complete status', () => {
    const { container } = render(<StatusTag status="complete" />);
    expect(container).toMatchSnapshot();
  });

  it('should render new status', () => {
    const { container } = render(<StatusTag status="new" />);
    expect(container).toMatchSnapshot();
  });
});
