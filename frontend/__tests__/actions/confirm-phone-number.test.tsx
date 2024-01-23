import { redirect } from '@remix-run/node';

import { describe, expect, it, vi } from 'vitest';

import { action } from '~/routes/_gcweb-app.personal-information.phone-number.confirm';

describe('Confirm Phone Number Action', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('Should redirect', async () => {
    let request = new Request('http://localhost:3000/personal-information/phone-number/confirm', {
      method: 'POST',
    });

    const response = await action({ request, context: {}, params: {} });

    expect(response.status).toBe(302);
    expect(response).toEqual(redirect('/personal-information/phone-number/success'));
  });
});
