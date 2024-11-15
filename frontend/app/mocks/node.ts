import { setupServer } from 'msw/node';

import { getRaoidcMockHandlers } from '~/mocks/raoidc.server';
import { mockEnabled } from '~/utils/env-utils.server';

export const server = setupServer(...(mockEnabled('raoidc') ? getRaoidcMockHandlers() : []));
