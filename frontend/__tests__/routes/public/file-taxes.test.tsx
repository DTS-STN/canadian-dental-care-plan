import type { AppLoadContext } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { loader } from '~/routes/public/apply/$id/adult/file-taxes';

vi.mock('~/.server/routes/helpers/apply-adult-route-helpers', () => ({
  loadApplyAdultState: vi.fn().mockReturnValue({
    id: '123',
  }),
}));

vi.mock('~/.server/utils/locale.utils');

describe('_public.apply.id.file-your-taxes', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loader()', () => {
    it('should load id', async () => {
      const response = await loader({
        request: new Request('http://localhost:3000/en/apply/123/file-your-taxes'),
        context: mock<AppLoadContext>(),
        params: { id: '123', lang: 'en' },
      });

      expect(response).toEqual({
        id: '123',
        meta: { title: 'gcweb:meta.title.template' },
      });
    });
  });
});
