import type { AppLoadContext } from '@remix-run/node';
import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/public/apply/$id/adult/file-taxes';

vi.mock('~/.server/routes/helpers/apply-adult-route-helpers', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
  }),
}));

vi.mock('~/utils/locale-utils.server', () => ({
  getFixedT: vi.fn().mockResolvedValue(vi.fn()),
}));

describe('_public.apply.id.file-your-taxes', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id', async () => {
      const session = await createMemorySessionStorage({ cookie: { secrets: [''] } }).getSession();
      session.set('csrfToken', 'csrfToken');

      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/file-your-taxes'),
        context: { ...mock<AppLoadContext>(), session },
        params: {},
      });

      expect(response).toEqual({
        id: '123',
        csrfToken: 'csrfToken',
        meta: {},
      });
    });
  });
});
