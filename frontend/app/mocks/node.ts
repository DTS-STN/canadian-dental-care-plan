import { setupServer } from 'msw/node';

import { getApplicationHistoryApiMockHandlers } from './application-history-api.server';
import { getSubscriptionApiMockHandlers } from './subscription-api.server';
import { getCCTApiMockHandlers } from '~/mocks/cct-api.server';
import { getLookupApiMockHandlers } from '~/mocks/lookup-api.server';
import { getPowerPlatformApiMockHandlers } from '~/mocks/power-platform-api.server';
import { getRaoidcMockHandlers } from '~/mocks/raoidc.server';
import { getStatusCheckApiMockHandlers } from '~/mocks/status-check-api.server';
import { getUserApiMockHandlers } from '~/mocks/user-api.server';
import { getWSAddressApiMockHandlers } from '~/mocks/wsaddress-api.server';
import { mockEnabled } from '~/utils/env-utils.server';

export const server = setupServer(
  ...(mockEnabled('application-history') ? getApplicationHistoryApiMockHandlers() : []),
  ...(mockEnabled('subscription') ? getSubscriptionApiMockHandlers() : []),
  ...(mockEnabled('cct') ? getCCTApiMockHandlers() : []),
  ...(mockEnabled('lookup') ? getLookupApiMockHandlers() : []),
  ...(mockEnabled('power-platform') ? getPowerPlatformApiMockHandlers() : []),
  ...(mockEnabled('raoidc') ? getRaoidcMockHandlers() : []),
  ...(mockEnabled('status-check') ? getStatusCheckApiMockHandlers() : []),
  ...(mockEnabled('wsaddress') ? getWSAddressApiMockHandlers() : []),
  ...(mockEnabled('user-api') ? getUserApiMockHandlers() : []),
);
