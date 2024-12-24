import { useLocation } from 'react-router';

import { getAltLanguage, getLanguage } from '~/utils/locale-utils';

type UseCurrentLanguageReturnType = {
  altLanguage: AppLocale;
  currentLanguage: AppLocale;
};

/**
 * A hook that returns the current language and its alternate language.
 *
 * @returns An object containing the current language the alternate language.
 * @throws {Error} If no language can be detected for the current route.
 */
export function useCurrentLanguage(): UseCurrentLanguageReturnType {
  const { pathname } = useLocation();
  const currentLanguage = getLanguage(pathname);
  const altLanguage = getAltLanguage(currentLanguage);
  return { altLanguage, currentLanguage };
}
