import { redirect } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';

import { action } from '~/routes/_gcweb-app.personal-information.phone-number.confirm';

vi.mock('~/services/user-service.server.ts', () => ({
  userService: {
    getUserId: vi.fn().mockReturnValue('00000000-0000-0000-0000-000000000000'),
    getUserInfo: vi.fn().mockReturnValue({
      firstName: 'John',
      homeAddress: '123 Home Street',
      lastName: 'Maverick',
      mailingAddress: '123 Mailing Street',
      phoneNumber: '(555) 555-5555',
      preferredLanguage: 'fr',
    }),
    updateUserInfo: vi.fn(),
  },
}));

vi.mock('~/services/session-service.server.ts', () => ({
  sessionService: {
    getSession: vi.fn().mockReturnValue({
      has: vi.fn().mockReturnValueOnce(true),
      get: vi.fn(),
      unset: vi.fn(),
    }),
    commitSession: vi.fn(),
  },
}));


describe('Confirm Phone Number Action', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('Should redirect to the success page when newPhoneNumber is present', async () => {
    let request = new Request('http://localhost:3000/personal-information/phone-number/confirm', {
      method: 'POST',
    });

    const response = await action({ request, context: {}, params: {} });

    expect(response.status).toBe(302);
    expect(response).toEqual(redirect('/personal-information/phone-number/success', { headers: { 'Set-Cookie': 'undefined' }}));
  });

  it('Should redirect to homepage page when newPhoneNumber is missing', async () => {
    let request = new Request('http://localhost:3000/personal-information/phone-number/confirm', {
      method: 'POST',
    });

    const response = await action({ request, context: {}, params: {} });

    expect(response.status).toBe(302);
    expect(response).toEqual(redirect('/'));
  });
});
