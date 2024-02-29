import { renderHook } from '@testing-library/react';

import { useLocation } from '@remix-run/react';

import { i18n } from 'i18next';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getClientEnv } from '~/utils/env-utils';
import { useI18nNamespaces } from '~/utils/route-utils';
import { useCanonicalURL } from '~/utils/seo-utils';

vi.mock('@remix-run/react');
vi.mock('react-i18next');
vi.mock('~/utils/env-utils');
vi.mock('~/utils/route-utils');

describe('useCanonicalURL', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should generate the canonical URL correctly when pathname is not root', () => {
    const mockOrigin = 'https://example.com';
    const mockPathname = '/example-path';
    const mockSearch = '?param1=value1&param2=value2';
    const mockLanguage = 'en';

    vi.mocked(useLocation, { partial: true }).mockReturnValue({ pathname: mockPathname, search: mockSearch });
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({ LANG_QUERY_PARAM: 'lang' });
    vi.mocked(useI18nNamespaces).mockReturnValue(['gcweb']);
    vi.mocked(useTranslation, { partial: true }).mockReturnValue({ i18n: { language: mockLanguage } as i18n });

    const { result } = renderHook(() => useCanonicalURL(mockOrigin));

    const expectedURL = `${mockOrigin}${mockPathname}${mockSearch}&lang=${mockLanguage}`;
    console.log({ currect: result.current, expectedURL });
    expect(result.current).toBe(expectedURL);
  });

  it('should generate the canonical URL correctly when pathname is root', () => {
    const mockOrigin = 'https://example.com';
    const mockPathname = '/';
    const mockSearch = '?param1=value1&param2=value2';
    const mockLanguage = 'en';

    vi.mocked(useLocation, { partial: true }).mockReturnValue({ pathname: mockPathname, search: mockSearch });
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({ LANG_QUERY_PARAM: 'lang' });
    vi.mocked(useI18nNamespaces).mockReturnValue(['gcweb']);
    vi.mocked(useTranslation, { partial: true }).mockReturnValue({ i18n: { language: mockLanguage } as i18n });

    const { result } = renderHook(() => useCanonicalURL(mockOrigin));

    const expectedURL = `${mockOrigin}${mockPathname}${mockSearch}`;
    console.log({ currect: result.current, expectedURL });
    expect(result.current).toBe(expectedURL);
  });
});
