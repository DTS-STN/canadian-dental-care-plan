import { Outlet } from 'react-router';

import { transformChildChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/renew-route-helpers';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  transformAdobeAnalyticsUrl: transformChildChildrenRouteAdobeAnalyticsUrl,
} as const satisfies RouteHandleData;

/**
 * Do-nothing parent route.
 * (placeholder for future code)
 */
export default function Route() {
  return <Outlet />;
}
