import { render, screen, waitFor } from '@testing-library/react';

import { useLocation, useParams } from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { LanguageSwitcher } from '~/components/language-switcher';
import { getAltLanguage, removeLanguageFromPath } from '~/utils/locale-utils';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('@remix-run/react', async (actual) => {
  // XXX :: GjB :: using actual <Link> component and useHref hook because I'm too lazy to mock it 🤷
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const { Link, useHref } = await actual<typeof import('@remix-run/react')>();

  return {
    Link,
    useHref,
    useLocation: vi.fn(),
    useParams: vi.fn(),
  };
});

vi.mock('~/utils/env-utils', () => ({
  getClientEnv: vi.fn(),
}));

vi.mock('~/utils/locale-utils', () => ({
  getAltLanguage: vi.fn(),
  removeLanguageFromPath: vi.fn(),
}));

describe('Language Switcher', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Should render with correct search params, and not have a11y issues', async () => {
    const basePath = '/home';

    const requestedLang = 'en';
    const responseLang = 'fr';

    const requestedPath = `/${requestedLang}${basePath}`;
    const requestedSearch = 'id=00000000-0000-0000-0000-000000000000';

    vi.mocked(useLocation, { partial: true }).mockReturnValue({ pathname: requestedPath, search: requestedSearch });
    vi.mocked(useParams).mockReturnValue({ lang: requestedLang });
    vi.mocked(getAltLanguage).mockReturnValue(responseLang);
    vi.mocked(removeLanguageFromPath).mockReturnValue(basePath);

    const RemixStub = createRemixStub([{ Component: () => <LanguageSwitcher>Français</LanguageSwitcher>, path: '/' }]);
    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('language-switcher'));

    expect(element.textContent).toBe('Français');
    expect(element.getAttribute('href')).toBe(`/${responseLang}${basePath}?${requestedSearch}`);
  });
});
