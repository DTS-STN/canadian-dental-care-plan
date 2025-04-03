import { render } from '@testing-library/react';

import { createRoutesStub } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ClientFriendlyStatusMarkdown } from '~/components/client-friendly-status-markdown';

describe('ClientFriendlyStatusMarkdown Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('renders markdown component', () => {
    const { container } = render(<ClientFriendlyStatusMarkdown content={''} />);
    expect(container.querySelector('div')?.className).toEqual('space-y-4');
  });

  it('renders markdown component with correct markdown parsing', () => {
    const content = `# H1\n## H2\n- unordered list item 1`;
    const { getByText } = render(<ClientFriendlyStatusMarkdown content={content} />);
    expect(getByText('H1')).toBeInTheDocument();
    expect(getByText('H2')).toBeInTheDocument();
    expect(getByText('unordered list item 1')).toBeInTheDocument();
  });

  it('renders inline-links from parsing anchors in markdown content', () => {
    const content = `[link text](https://www.example.com)`;

    const RoutesStub = createRoutesStub([
      {
        Component: () => <ClientFriendlyStatusMarkdown content={content} />,
        path: '/',
      },
    ]);

    const { getByRole } = render(<RoutesStub />);
    const link = getByRole('link');
    expect(link.className).toEqual('text-slate-700 underline hover:text-blue-700 focus:text-blue-700 external-link');
    expect(link.getAttribute('href')).toEqual('https://www.example.com');
    expect(link.getAttribute('target')).toEqual('_blank');
    expect(link.textContent).toEqual('link text (screen-reader.new-tab)');
  });
});
