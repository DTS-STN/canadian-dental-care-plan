import { useHref, useLocation, useParams } from '@remix-run/react';

import type { InlineLinkProps } from '~/components/inline-link';
import { InlineLink } from '~/components/inline-link';
import { getAltLanguage, removeLanguageFromPath } from '~/utils/locale-utils';

export type LanguageSwitcherProps = Omit<InlineLinkProps, 'to' | 'reloadDocument'>;

/**
 * Component that can be used to switch from one language to another.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function LanguageSwitcher({ children, ...props }: LanguageSwitcherProps) {
  const location = useLocation();
  const params = useParams();

  const altLang = getAltLanguage(params.lang);
  const pathname = removeLanguageFromPath(location.pathname);
  const href = useHref({ ...location, pathname });

  return (
    <InlineLink data-testid="language-switcher" reloadDocument to={href} targetLang={altLang} {...props}>
      {children}
    </InlineLink>
  );
}
