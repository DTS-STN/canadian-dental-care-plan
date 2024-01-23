import { redirect } from '@remix-run/node';

import { describe, expect, it } from 'vitest';

import { action } from '~/routes/_gcweb-app.personal-information.phone-number.edit';

describe('Edit Phone Number Action', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('Should redirect without validation erros', async () => {
    const formData = new FormData();
    formData.append('phoneNumber', '819 426-5555');
    let request = new Request('http://localhost:3000/personal-information/phone-number/edit', {
      method: 'POST',
      body: formData,
    });

    const response = await action({ request, context: {}, params: {} });

    expect(response.status).toBe(302);
    expect(response.url).toEqual(redirect('/personal-information/phone-number/confirm').url);
  });

  it('Should return validation errors', async () => {
    const formData = new FormData();
    formData.append('phoneNumber', '819 426-55');
    let request = new Request('http://localhost:3000/personal-information/phone-number/edit', {
      method: 'POST',
      body: formData,
    });

    const response = await action({ request, context: {}, params: {} });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.errors).toHaveProperty('phoneNumber');
  });
});
