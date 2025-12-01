import { render } from '@testing-library/react';

import { createRoutesStub } from 'react-router';

import { describe, expect, it } from 'vitest';

import { NavigationButton, NavigationButtonLink } from '~/components/navigation-buttons';

describe('NavigationButton', () => {
  it('renders previous button', () => {
    const { container } = render(
      <NavigationButton direction="previous" id="prev-btn" variant="secondary">
        Your marital status
      </NavigationButton>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders next button', () => {
    const { container } = render(
      <NavigationButton direction="next" id="next-btn" variant="primary">
        Access to dental insurance
      </NavigationButton>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders previous button when loading', () => {
    const { container } = render(
      <NavigationButton direction="previous" id="prev-btn" variant="secondary" loading loadingPosition="start">
        Your marital status
      </NavigationButton>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders next button when loading', () => {
    const { container } = render(
      <NavigationButton direction="next" id="next-btn" variant="primary" loading loadingPosition="end">
        Access to dental insurance
      </NavigationButton>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});

describe('NavigationButtonLink', () => {
  it('renders previous link', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => (
          <NavigationButtonLink direction="previous" to="/prev" id="prev-link" variant="secondary">
            Your marital status
          </NavigationButtonLink>
        ),
        path: '/',
      },
    ]);
    const { container } = render(<RoutesStub />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders next link', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => (
          <NavigationButtonLink direction="next" to="/next" id="next-link" variant="primary">
            Access to dental insurance
          </NavigationButtonLink>
        ),
        path: '/',
      },
    ]);
    const { container } = render(<RoutesStub />);
    expect(container).toMatchSnapshot('expected html');
  });
});
