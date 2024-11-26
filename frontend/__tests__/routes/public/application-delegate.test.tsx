import type { AppLoadContext } from '@remix-run/node';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/public/apply/$id/application-delegate';

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({
  loadApplyState: vi.fn().mockReturnValue({
    id: '123',
  }),
}));

vi.mock('~/.server/utils/locale.utils');

describe('_public.apply.id.application-delegate', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/application-delegate'),
        context: mock<AppLoadContext>(),
        params: {},
      });

      expect(response).toEqual({
        id: '123',
        meta: { title: 'gcweb:meta.title.template' },
      });
    });
  });
});
