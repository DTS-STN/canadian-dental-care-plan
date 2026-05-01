import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { ZodConfig } from '~/components/zod-config';

describe('ZodConfig component', () => {
  it('should render the ZodConfig component correctly', () => {
    const { container } = render(<ZodConfig nonce="test-nonce" />);
    expect(container).toMatchSnapshot('expected html');
  });
});
