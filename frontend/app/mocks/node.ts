import { setupServer } from 'msw/node';

import { getClientApplicationApiMockHandlers } from './client-application-api.server';
import { getCCTApiMockHandlers } from '~/mocks/cct-api.server';
import { getPowerPlatformApiMockHandlers } from '~/mocks/power-platform-api.server';
import { getRaoidcMockHandlers } from '~/mocks/raoidc.server';
import { getStatusCheckApiMockHandlers } from '~/mocks/status-check-api.server';
import { getWSAddressApiMockHandlers } from '~/mocks/wsaddress-api.server';
import { mockEnabled } from '~/utils/env-utils.server';

export const server = setupServer(
  ...(mockEnabled('cct') ? getCCTApiMockHandlers() : []),
  ...(mockEnabled('power-platform') ? getPowerPlatformApiMockHandlers() : []),
  ...(mockEnabled('raoidc') ? getRaoidcMockHandlers() : []),
  ...(mockEnabled('status-check') ? getStatusCheckApiMockHandlers() : []),
  ...(mockEnabled('wsaddress') ? getWSAddressApiMockHandlers() : []),
  ...(mockEnabled('client-application') ? getClientApplicationApiMockHandlers() : []),
);
