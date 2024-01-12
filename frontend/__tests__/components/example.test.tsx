import { render, screen, waitFor } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('render test component and tests accessiblity', async () => {
  function TestComponent() {
    return <p>Hello World</p>;
  }

  const RemixStub = createRemixStub([
    {
      path: '/',
      Component: TestComponent,
    },
  ]);

  const { container } = render(<RemixStub />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();

  await waitFor(() => screen.findByText('Hello World'));
});
