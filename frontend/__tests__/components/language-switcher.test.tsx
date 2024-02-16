import { render, screen, waitFor } from '@testing-library/react';

import { useSearchParams } from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LanguageSwitcher } from '~/components/language-switcher';
import { getClientEnv } from '~/utils/env-utils';
import { getAltLanguage } from '~/utils/locale-utils';

expect.extend(toHaveNoViolations);

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn().mockReturnValue({
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('@remix-run/react', async (actual) => {
  // XXX :: GjB :: using actual <Link> component because I'm too lazy to mock it 🤷
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const { Link } = await actual<typeof import('@remix-run/react')>();
  return { Link, useSearchParams: vi.fn() };
});

vi.mock('~/utils/env-utils', () => ({
  getClientEnv: vi.fn(),
}));

vi.mock('~/utils/locale-utils', () => ({
  getAltLanguage: vi.fn(),
}));

describe('Language Switcher', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Should render with correct search params, and not have a11y issues', async () => {
    vi.mocked(getAltLanguage).mockReturnValue('en');
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({ LANG_QUERY_PARAM: 'language' });
    vi.mocked(useSearchParams, { partial: true }).mockReturnValue([new URLSearchParams({ id: '00000000-0000-0000-0000-000000000000' })]);
    vi.mocked(useTranslation().i18n).language = 'fr';

    const RemixStub = createRemixStub([{ Component: () => <LanguageSwitcher>Français</LanguageSwitcher>, path: '/' }]);
    const { container } = render(<RemixStub />);

    const results = await axe(container);
    const element = await waitFor(() => screen.findByTestId('language-switcher'));

    expect(results).toHaveNoViolations();
    expect(element.textContent).toBe('Français');
    expect(element.getAttribute('href')).toBe('/?id=00000000-0000-0000-0000-000000000000&language=en');
  });
});
