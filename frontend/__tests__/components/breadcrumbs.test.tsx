import { render } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { describe, expect, it } from 'vitest';

import { Breadcrumbs } from '~/components/breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders breadcrumbs with items', () => {
    const items = [
      { content: 'Home', to: '/' },
      { content: 'About', to: '/about' },
      { content: 'Contact', to: '/contact' },
    ];

    const RemixStub = createRemixStub([
      {
        Component: () => <Breadcrumbs items={items} />,
        path: '/',
      },
    ]);

    const { getByText, getAllByRole } = render(<RemixStub />);

    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('About')).toBeInTheDocument();
    expect(getByText('Contact')).toBeInTheDocument();

    const listItems = getAllByRole('listitem');
    expect(listItems.length).toBe(3);
  });

  it('renders breadcrumbs with items and without links', () => {
    const items = [{ content: 'Home' }, { content: 'About' }, { content: 'Contact' }];

    const { getByText, getAllByRole } = render(<Breadcrumbs items={items} />);

    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('About')).toBeInTheDocument();
    expect(getByText('Contact')).toBeInTheDocument();

    const listItems = getAllByRole('listitem');
    expect(listItems.length).toBe(3);
  });
});
