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
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders markdown component with correct markdown parsing', () => {
    const content = `# H1\n## H2\n- unordered list item 1`;
    const { container } = render(<ClientFriendlyStatusMarkdown content={content} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders inline-links from parsing anchors in markdown content', () => {
    const content = `[link text](https://www.example.com)`;

    const RoutesStub = createRoutesStub([
      {
        Component: () => <ClientFriendlyStatusMarkdown content={content} />,
        path: '/',
      },
    ]);

    const { container } = render(<RoutesStub />);
    expect(container).toMatchSnapshot('expected html');
  });
});
