import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getUserOrigin } from '~/utils/user-origin-utils.server';

vi.mock('@remix-run/node', () => ({
  createMemorySessionStorage: vi.fn().mockReturnValue({
    getSession: vi.fn().mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
    }),
  }),
}));

describe('getUserOrigin', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return msca-d if msca-d is set in the search params', async () => {
    const url = new URL('http://www.example.com');
    url.searchParams.append('origin', 'msca-d');
    const req = new Request(url);
    const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
    expect(getUserOrigin(req, session)).toEqual('msca-d');
  });

  it('should return msca-d if msca-d is set in the session', async () => {
    const url = new URL('http://www.example.com');
    const req = new Request(url);
    const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
    session.set('userOrigin', 'msca-d');
    expect(getUserOrigin(req, session)).toEqual('msca-d');
  });

  it("should return msca-d as a default if the origin isn't in the search params or session", async () => {
    const url = new URL('http://www.example.com');
    const req = new Request(url);
    const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
    expect(getUserOrigin(req, session)).toEqual('msca-d');
  });
});
