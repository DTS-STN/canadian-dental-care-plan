import { Outlet } from 'react-router';

import type { Route } from './+types/layout';

import { transformChildChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/protected-apply-route-helpers';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  transformAdobeAnalyticsUrl: transformChildChildrenRouteAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

/**
 * Do-nothing parent route.
 * (placeholder for future code)
 */
export default function Route({ loaderData, params }: Route.ComponentProps) {
  return <Outlet />;
}
