import { useMatches, useParams } from '@remix-run/react';

import type { InlineLinkProps } from '~/components/inline-link';
import { InlineLink } from '~/components/inline-link';
import { getAltLanguage } from '~/utils/locale-utils';

export type LanguageSwitcherProps = Omit<InlineLinkProps, 'to' | 'reloadDocument'>;

/**
 * Component that can be used to switch from one language to another.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function LanguageSwitcher({ children, ...props }: LanguageSwitcherProps) {
  const matches = useMatches();
  const params = useParams();

  const altLang = getAltLanguage(params.lang);
  const currentRoute = matches[matches.length - 1];
  const routeId = currentRoute.id.replace(/-(en|fr)$/, '');

  return (
    <InlineLink data-testid="language-switcher" reloadDocument routeId={routeId} params={params} targetLang={altLang} {...props}>
      {children}
    </InlineLink>
  );
}
