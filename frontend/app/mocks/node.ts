import { setupServer } from 'msw/node';

import { getCCTApiMockHandlers } from '~/mocks/cct-api.server';
import { getLookupApiMockHandlers } from '~/mocks/lookup-api.server';
import { getPowerPlatformApiMockHandlers } from '~/mocks/power-platform-api.server';
import { getWSAddressApiMockHandlers } from '~/mocks/wsaddress-api.server';

export const server = setupServer(...getCCTApiMockHandlers(), ...getLookupApiMockHandlers(), ...getPowerPlatformApiMockHandlers(), ...getWSAddressApiMockHandlers());
