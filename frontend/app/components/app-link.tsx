import type { ComponentProps } from 'react';

import type { Params, To } from 'react-router';
import { Link, useHref } from 'react-router';

import invariant from 'tiny-invariant';

import { NewTabIndicator } from '~/components/new-tab-indicator';
import { getPathById } from '~/utils/route-utils';

/**
 * Props for the AppLink component.
 */
export interface AppLinkProps extends OmitStrict<ComponentProps<typeof Link>, 'to'> {
  newTabIndicator?: boolean;
  params?: Params;
  routeId?: string;
  targetLang?: AppLocale;
  to?: To;
}

function getTo(params?: Params, routeId?: string, targetLang?: AppLocale, to?: To) {
  if (to) {
    return to;
  }

  invariant(routeId, 'either routeId or to must be provided');
  const lang = targetLang ?? params?.lang;
  return getPathById(routeId, { ...params, lang });
}

/**
 * A component that renders a localized link.
 */
export function AppLink({ children, newTabIndicator, params, routeId, targetLang, to, ...props }: AppLinkProps) {
  const href = useHref(getTo(params, routeId, targetLang, to), { relative: 'route' });

  const isExternalHref = typeof to === 'string' && to.startsWith('http');

  if (isExternalHref) {
    // external links must be respected as they are 🫡
    return (
      <Link {...props} to={to}>
        {children}
        {newTabIndicator && <NewTabIndicator />}
      </Link>
    );
  }

  return (
    <Link {...props} to={href}>
      {children}
      {newTabIndicator && <NewTabIndicator />}
    </Link>
  );
}
