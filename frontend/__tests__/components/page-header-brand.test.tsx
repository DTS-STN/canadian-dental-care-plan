import { render } from '@testing-library/react';

import { createRoutesStub } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageHeaderBrand } from '~/components/page-header-brand';

vi.mock('~/components/language-switcher', () => ({
  LanguageSwitcher: vi.fn().mockImplementation(({ children }) => <div>{children}</div>),
}));

vi.mock('~/hooks', () => ({
  useCurrentLanguage: vi.fn().mockReturnValue({
    currentLanguage: 'en',
    altLanguage: 'fr',
  }),
}));

vi.mock('~/utils/locale-utils.ts', () => ({
  getAltLanguage: (lang: string) => lang,
}));

describe('PageHeaderBrand', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('renders without crashing', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <PageHeaderBrand />,
        path: '/',
      },
    ]);
    render(<RoutesStub />);
  });

  it('displays the Government of Canada logo', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <PageHeaderBrand />,
        path: '/',
      },
    ]);
    const { getByAltText } = render(<RoutesStub />);
    expect(getByAltText('gcweb:header.govt-of-canada.text')).toBeInTheDocument();
  });

  it('displays the Language Switcher', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => <PageHeaderBrand />,
        path: '/',
      },
    ]);
    const { getByText } = render(<RoutesStub />);
    expect(getByText('gcweb:language-switcher.alt-lang')).toBeInTheDocument();
  });
});
