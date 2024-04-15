import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loader } from '~/routes/$lang+/_public+/apply+/$id+/dob-eligibility';

vi.mock('~/route-helpers/apply-route-helpers.server', () => ({
  getApplyRouteHelpers: vi.fn().mockReturnValue({
    loadState: vi.fn().mockReturnValue({
      id: '123',
    }),
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

describe('_public.apply.id.dob-eligibility', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/dob-eligibility'),
        context: { session },
        params: {},
      });

      const data = await response.json();

      expect(data).toEqual({
        id: '123',
        csrfToken: 'csrfToken',
        meta: {},
      });
    });
  });
});
