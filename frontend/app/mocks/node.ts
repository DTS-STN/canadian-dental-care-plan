import { setupServer } from 'msw/node';

import { getCCTApiMockHandlers } from '~/mocks/cct-api.server';
import { getPowerPlatformApiMockHandlers } from '~/mocks/power-platform-api.server';
import { getRaoidcMockHandlers } from '~/mocks/raoidc.server';
import { mockEnabled } from '~/utils/env-utils.server';

// prettier-ignore
export const server = setupServer(
  ...(mockEnabled('cct') ? getCCTApiMockHandlers() : []),
  ...(mockEnabled('power-platform') ? getPowerPlatformApiMockHandlers() : []),
  ...(mockEnabled('raoidc') ? getRaoidcMockHandlers() : []),
);
