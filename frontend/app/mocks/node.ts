import { setupServer } from 'msw/node';

import { getPowerPlatformApiMockHandlers } from '~/mocks/power-platform-api.server';
import { getRaoidcMockHandlers } from '~/mocks/raoidc.server';
import { mockEnabled } from '~/utils/env-utils.server';

// prettier-ignore
export const server = setupServer(
  ...(mockEnabled('power-platform') ? getPowerPlatformApiMockHandlers() : []),
  ...(mockEnabled('raoidc') ? getRaoidcMockHandlers() : []),
);
