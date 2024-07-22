import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { DescriptionListItem } from '~/components/description-list-item';

describe('DescriptionListItem', () => {
  it('should render the compnent', () => {
    const { container } = render(<DescriptionListItem term="term">definition</DescriptionListItem>);
    expect(container.querySelector('div')?.className).toEqual('py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6');
    expect(screen.getByText('term')).toBeInTheDocument();
    expect(screen.getByText('definition')).toBeInTheDocument();
  });
});
