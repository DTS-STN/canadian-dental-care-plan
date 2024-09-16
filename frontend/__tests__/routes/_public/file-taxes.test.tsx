import { createMemorySessionStorage } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ContainerProvider } from '~/.server/providers/container.provider';
import { loader } from '~/routes/$lang/_public/apply/$id/adult/file-taxes';

vi.mock('~/route-helpers/apply-adult-route-helpers.server', () => ({
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
        context: { session, ...mock<ContainerProvider>() },
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
