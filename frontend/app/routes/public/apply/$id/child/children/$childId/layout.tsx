import { Outlet } from 'react-router';

import { transformChildrenRouteAdobeAnalyticsUrl } from '~/route-helpers/apply-child-route-helpers';
import type { RouteHandleData } from '~/utils/route-utils';

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
