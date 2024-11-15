import { useMatches, useParams, useSearchParams } from '@remix-run/react';

import type { InlineLinkProps } from '~/components/inline-link';
import { InlineLink } from '~/components/inline-link';
import { isI18nPageRoute } from '~/routes/routes';
import { getAltLanguage } from '~/utils/locale-utils';
import { findRouteById, getPathById } from '~/utils/route-utils';

export type LanguageSwitcherProps = OmitStrict<InlineLinkProps, 'to' | 'reloadDocument'>;

/**
 * Component that can be used to switch from one language to another.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function LanguageSwitcher({ children, ...props }: LanguageSwitcherProps) {
  const matches = useMatches();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const altLang = getAltLanguage(params.lang);
  const currentRoute = matches[matches.length - 1];
  const routeId = currentRoute.id.replace(/-(en|fr)$/, '');
  const route = findRouteById(routeId);
  const pathname = isI18nPageRoute(route) //
    ? getPathById(routeId, { ...params, lang: altLang })
    : switchLanguage(currentRoute.pathname);

  const search = searchParams.toString();

  return (
    <InlineLink data-testid="language-switcher" reloadDocument to={{ pathname, search }} {...props}>
      {children}
    </InlineLink>
  );
}

/**
 * Switches /en → /fr and vice versa.
 */
function switchLanguage(pathname: string): string {
  return pathname.replace(/^\/(en|fr)/, (substring) => `${substring === '/en' ? '/fr' : '/en'}`);
}
