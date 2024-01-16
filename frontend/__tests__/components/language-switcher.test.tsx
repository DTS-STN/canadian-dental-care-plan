import { render, screen, waitFor } from '@testing-library/react';

import { createRemixStub } from '@remix-run/testing';

import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it } from 'vitest';

import { LanguageSwitcher } from '~/components/language-switcher';

expect.extend(toHaveNoViolations);

vi.mock('~/utils/env.ts', () => {
  const getClientEnv = vi.fn();
  getClientEnv.mockReturnValue({
    LANG_QUERY_PARAM: 'lang',
  });
  return {
    getClientEnv,
  };
});

vi.mock('~/utils/locale-utils.ts', () => {
  const getAltLanguage = vi.fn();
  getAltLanguage.mockReturnValue('en');
  return {
    getAltLanguage,
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Language Switcher', () => {
  it('Should render and not have a11y issues', async () => {
    const RemixStub = createRemixStub([
      {
        Component: () => <LanguageSwitcher>Français</LanguageSwitcher>,
        path: '',
      },
    ]);

    const { container } = render(<RemixStub />);
    const results = await axe(container);
    const element = await waitFor(() => screen.findByTestId('language-switcher'));

    expect(results).toHaveNoViolations();
    expect(element.textContent).toBe('Français');
    expect(element.getAttribute('href')).toBe('/?lang=en');
  });
});
