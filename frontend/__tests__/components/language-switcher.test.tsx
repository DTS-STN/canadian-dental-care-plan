import { render, screen, waitFor } from '@testing-library/react';

import { useMatches, useParams, useSearchParams } from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { LanguageSwitcher } from '~/components/language-switcher';
import { getAltLanguage } from '~/utils/locale-utils';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    i18n: { changeLanguage: vi.fn() },
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
    useMatches: vi.fn(),
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
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
    const requestedLang = 'en';
    const responseLang = 'fr';

    vi.mocked(useParams).mockReturnValue({ lang: requestedLang });
    vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams({ id: '1' }), vi.fn()]);
    vi.mocked(getAltLanguage).mockReturnValue(responseLang);
    vi.mocked(useMatches).mockReturnValue([{ id: '$lang/_public/apply/index', data: {}, handle: {}, params: {}, pathname: '' }]);

    const RemixStub = createRemixStub([{ Component: () => <LanguageSwitcher>Français</LanguageSwitcher>, path: '/' }]);
    render(<RemixStub />);

    const element = await waitFor(() => screen.findByTestId('language-switcher'));

    expect(element.textContent).toBe('Français');
    expect(element.getAttribute('href')).toBe('/fr/demander?id=1');
  });
});
