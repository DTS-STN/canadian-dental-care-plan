import { Outlet } from '@remix-run/react';

import { transformChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/apply-child-route-helpers';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  transformAdobeAnalyticsUrl: transformChildrenRouteAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

/**
 * Do-nothing parent route.
 * (placeholder for future code)
 */
export default function Route() {
  return <Outlet />;
}
