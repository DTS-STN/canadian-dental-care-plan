import { HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getUserService } from '~/services/user-service.server';

global.fetch = vi.fn();

vi.mock('~/utils/logging.server', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    audit: vi.fn(),
    trace: vi.fn(),
  }),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn().mockReturnValue({
    CDCP_API_BASE_URI: 'https://api.cdcp.example.com',
  }),
}));

describe('user-service.server tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
  describe('getUserService()', () => {
    it('should return 204 response after creating a user', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 204 }));

      const userService = getUserService();
      const newUserInfo = await userService.createUserWithAttributesAndEmail('test@email', '1234567890');

      expect(newUserInfo).toBe(204);
    });

    it('should throw error if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(new HttpResponse(null, { status: 500 }));

      const userService = getUserService();
      await expect(() => userService.createUserWithAttributesAndEmail('sin', 'userId')).rejects.toThrowError();
    });
  });
});
