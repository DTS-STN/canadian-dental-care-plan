import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/_gcweb-app.personal-information._index';

vi.mock('~/services/user-service.server.ts', () => {
  const getUserService = vi.fn();
  getUserService.mockReturnValue({
    getUserId: () => '00000000-0000-0000-0000-000000000000',
    getUserInfo: () => ({
      firstName: 'John',
      homeAddress: '123 Home Street',
      lastName: 'Maverick',
      mailingAddress: '123 Mailing Street',
      phoneNumber: '(555) 555-5555',
      preferredLanguage: 'fr',
    }),
  });
  return {
    getUserService,
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Loader for _gcweb-app.personal-information._index', () => {
  it('Loader should return a Response object', async () => {
    const response = await loader({
      request: new Request('http://localhost:3000/personal-information'),
      context: {},
      params: {},
    });
    expect(response).toBeInstanceOf(Response);
  });
  it('Loader response status should be 200', async () => {
    const response = await loader({
      request: new Request('http://localhost:3000/personal-information'),
      context: {},
      params: {},
    });
    expect(response.status).toBe(200);
  });
  it('Loader should return correct mocked data', async () => {
    const response = await loader({
      request: new Request('http://localhost:3000/personal-information'),
      context: {},
      params: {},
    });
    const data = await response.json();
    expect(data).toEqual({
      user: {
        firstName: 'John',
        homeAddress: '123 Home Street',
        lastName: 'Maverick',
        mailingAddress: '123 Mailing Street',
        phoneNumber: '(555) 555-5555',
        preferredLanguage: 'fr',
      },
    });
  });
});
