import { redirect } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';

import { action } from '~/routes/_gcweb-app.update-info';

vi.mock('~/services/user-service.server.ts', () => ({
  userService: {
    getUserId: vi.fn(),
    updateUserInfo: vi.fn(),
  },
}));

describe('Update Information Action', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('Should redirect if no validation errors', async () => {
    const formData = new FormData();
    formData.append('phoneNumber', '(123) 456-7890');
    let request = new Request('http://localhost:3000/update-info', {
      method: 'POST',
      body: formData,
    });

    const response = await action({ request, context: {}, params: {} });

    expect(response.status).toBe(302);
    expect(response).toEqual(redirect('/update-info-success'));
  });

  it('Should return validation errors', async () => {
    const formData = new FormData();
    formData.append('phoneNumber', 'not a phone number');
    let request = new Request('http://localhost:3000/update-info', {
      method: 'POST',
      body: formData,
    });

    const response = await action({ request, context: {}, params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.errors).toHaveProperty('phoneNumber');
  });
});
