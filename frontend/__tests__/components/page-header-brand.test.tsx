import { render } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageHeaderBrand } from '~/components/page-header-brand';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      getFixedT: (lang: string) => (key: string) => key,
    },
  }),
}));

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
    const RemixStub = createRemixStub([
      {
        Component: () => <PageHeaderBrand />,
        path: '/',
      },
    ]);
    render(<RemixStub />);
  });

  it('displays the Government of Canada logo', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <PageHeaderBrand />,
        path: '/',
      },
    ]);
    const { getByAltText } = render(<RemixStub />);
    expect(getByAltText('gcweb:header.govt-of-canada.text')).toBeInTheDocument();
  });

  it('displays the Language Switcher', () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <PageHeaderBrand />,
        path: '/',
      },
    ]);
    const { getByText } = render(<RemixStub />);
    expect(getByText('gcweb:language-switcher.alt-lang')).toBeInTheDocument();
  });
});
