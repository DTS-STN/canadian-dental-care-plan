import { ComponentProps } from 'react';

import { Link, Params, useHref } from '@remix-run/react';

import type { To } from 'react-router';
import invariant from 'tiny-invariant';

import { getPathById } from '~/utils/route-utils';

/**
 * Props for the AppLink component.
 */
export interface AppLinkProps extends Omit<ComponentProps<typeof Link>, 'to'> {
  params?: Params;
  routeId?: string;
  targetLang?: 'en' | 'fr';
  to?: To;
}

function getTo(params?: Params, routeId?: string, targetLang?: 'en' | 'fr', to?: To) {
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
export function AppLink({ params, routeId, targetLang, to, ...props }: AppLinkProps) {
  const href = useHref(getTo(params, routeId, targetLang, to), { relative: 'route' });

  const isExternalHref = typeof to === 'string' && to.startsWith('http');

  if (isExternalHref) {
    // external links must be respected as they are 🫡
    return <Link {...props} to={to} />;
  }

  return (
    <Link {...props} to={href}>
      {props.children}
    </Link>
  );
}
