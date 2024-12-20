import { Outlet } from '@remix-run/react';

import { transformAdultChildChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/renew-route-helpers';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  transformAdobeAnalyticsUrl: transformAdultChildChildrenRouteAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

/**
 * Do-nothing parent route.
 * (placeholder for future code)
 */
export default function Route() {
  return <Outlet />;
}
