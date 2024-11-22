import { setupServer } from 'msw/node';

import { mockEnabled } from '~/.server/utils/env.utils';
import { getRaoidcMockHandlers } from '~/mocks/raoidc.server';

export const server = setupServer(...(mockEnabled('raoidc') ? getRaoidcMockHandlers() : []));
