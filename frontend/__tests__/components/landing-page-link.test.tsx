import { render } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { LandingPageLink } from '~/components/landing-page-link';

expect.extend(toHaveNoViolations);

describe('LandingPageLink', () => {
  it('Should render correctly', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/',
        Component: () => (
          <LandingPageLink title="title" description="description" to="/">
            anchor text
          </LandingPageLink>
        ),
      },
    ]);

    const { container } = render(<RemixStub />);
    const anchor = container.querySelector('a');
    const title = container.querySelector('h2');
    const description = container.querySelector('p');

    expect(anchor).toHaveAttribute('href', '/');
    expect(anchor?.textContent).toBe('anchor text');
    expect(title?.textContent).toBe('title');
    expect(description?.textContent).toBe('description');
  });

  it('Should not have any a11y issues', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/',
        Component: () => (
          <LandingPageLink title="title" description="description" to="/">
            hello
          </LandingPageLink>
        ),
      },
    ]);

    const { container } = render(<RemixStub />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
