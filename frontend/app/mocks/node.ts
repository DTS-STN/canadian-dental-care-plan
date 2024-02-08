import { setupServer } from 'msw/node';

import { getCCTApiMockHandlers } from '~/mocks/cct-api.server';
import { getLookupApiMockHandlers } from '~/mocks/lookup-api.server';
import { getPowerPlatformApiMockHandlers } from '~/mocks/power-platform-api.server';
import { getRaoidcMockHandlers } from '~/mocks/raoidc.server';
import { getWSAddressApiMockHandlers } from '~/mocks/wsaddress-api.server';
import { getEnv } from '~/utils/env.server';

const { ENABLED_MOCKS } = getEnv();

export const server = setupServer(
  ...(ENABLED_MOCKS.includes('cct') ? getCCTApiMockHandlers() : []),
  ...(ENABLED_MOCKS.includes('lookup') ? getLookupApiMockHandlers() : []),
  ...(ENABLED_MOCKS.includes('power-platform') ? getPowerPlatformApiMockHandlers() : []),
  ...(ENABLED_MOCKS.includes('raoidc') ? getRaoidcMockHandlers() : []),
  ...(ENABLED_MOCKS.includes('wsaddress') ? getWSAddressApiMockHandlers() : []),
);
