import { render } from '@testing-library/react';

import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { describe, expect, it } from 'vitest';

import { Badge } from '~/components/badge';

describe('Badge', () => {
  it('renders with default props', () => {
    const { container } = render(<Badge>Default Badge</Badge>);
    expect(container).toMatchSnapshot('expected html');
  });

  const variants = ['danger', 'default', 'gray', 'info', 'success', 'warning'] as const;
  const sizes = ['base', 'lg'] as const;

  const combinations = variants.flatMap((variant) => sizes.map((size) => [variant, size] as const));
  it.each(combinations)('renders variant="%s" and size="%s"', (variant, size) => {
    const { container } = render(
      <Badge variant={variant} size={size}>
        <FontAwesomeIcon icon={faStar} />
        {variant} {size}
      </Badge>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders as a child', () => {
    const { container } = render(
      <Badge asChild>
        <a href="#top">Link Badge</a>
      </Badge>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
