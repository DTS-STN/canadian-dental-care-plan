import type { AppLoadContext } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';

import { TYPES } from '~/.server/constants';
import type { InstrumentationService } from '~/.server/observability';
import { loader } from '~/routes/public/apply/$id/file-taxes';

vi.mock('~/.server/routes/helpers/apply-route-helpers', () => ({
  loadApplyState: vi.fn().mockReturnValue({
    id: '123',
    applicationYear: {
      intakeYearId: '2025',
      taxYear: '2024',
    },
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
      const mockContext = mockDeep<AppLoadContext>();
      mockContext.appContainer.get.calledWith(TYPES.observability.InstrumentationService).mockReturnValueOnce(mock<InstrumentationService>());

      const response = await loader({ request: new Request('http://localhost:3000/en/apply/123/file-your-taxes'), context: mockContext, params: { id: '123', lang: 'en' } });

      expect(response).toEqual({ meta: { title: 'gcweb:meta.title.template' }, taxYear: '2024' });
    });
  });
});
