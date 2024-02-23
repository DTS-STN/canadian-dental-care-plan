import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { getLetterEntities } from '~/mocks/cct-api.server';
import { getAllLetterTypes } from '~/mocks/power-platform-api.server';
import { getInteropService } from '~/services/interop-service.server';

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
  }),
}));

vi.mock('~/utils/env.server.ts', () => ({
  getEnv: vi.fn().mockReturnValue({
    INTEROP_API_BASE_URI: 'https://api.example.com',
    CCT_API_BASE_URI: 'https://api.example.com',
    CCT_VAULT_COMMUNITY: 'SecurityReview',
  }),
}));

const handlers = [
  http.get('https://api.example.com/cctws/OnDemand/api/GetDocInfoByClientId', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userid') as string;
    const letterEntities = getLetterEntities(userId);
    return HttpResponse.json(letterEntities);
  }),
  http.get('https://api.example.com/letter-types', () => {
    const letterEntities = getAllLetterTypes();
    return HttpResponse.json(letterEntities);
  }),
];

const server = setupServer(...handlers);

const interopService = getInteropService();

describe('interop-service.server.ts', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterAll(() => {
    server.close();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('it should return letters associated with a valid user', async () => {
    const letters = await interopService.getLetterInfoByClientId('00000000-0000-0000-0000-000000000000', 'clientId');
    expect(letters.length).toBeGreaterThan(0);
  });
  it('it should not return letters associated with an invalid user', async () => {
    const letters = await interopService.getLetterInfoByClientId('00000000-0000-0000-0000-000000000001', 'clientId');
    expect(letters.length).toBe(0);
  });

  it('it should throw and error when given an invalid user', () => {
    expect(async () => await interopService.getLetterInfoByClientId('invalidUserId', 'clientId')).rejects.toThrowError();
  });

  it('it should return all the letter types', async () => {
    const letterTypes = await interopService.getAllLetterTypes();
    expect(letterTypes.length).toBeGreaterThan(0);
  });
});
