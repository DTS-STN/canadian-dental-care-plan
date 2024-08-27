import { ProxyAgent } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';

describe('fetch-utils.server', () => {
  vi.stubGlobal('fetch', vi.fn());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getFetchFn', () => {
    vi.mock('~/utils/env-utils.server', () => ({
      getEnv: vi.fn(),
    }));

    vi.mock('~/utils/logging.server', () => ({
      getLogger: () => ({
        debug: vi.fn(),
      }),
    }));

    vi.mock('undici', () => ({
      ProxyAgent: vi.fn(),
    }));

    it('should return global fetch when no proxy URL is provided', () => {
      const fetchFn = getFetchFn();
      expect(fetchFn).toBe(global.fetch);
    });

    it('should return custom fetch function when a proxy URL is provided', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ HTTP_PROXY_TLS_TIMEOUT: 1000 });
      vi.mocked(fetch, { partial: true }).mockResolvedValue({ status: 200 });

      const proxyUrl = 'http://proxy.example.com';
      const fetchFn = getFetchFn(proxyUrl);
      expect(fetchFn).not.toBe(global.fetch);

      await fetchFn('https://api.example.com');
      expect(ProxyAgent).toHaveBeenCalledWith({ uri: proxyUrl, proxyTls: { timeout: 1000 } });
      expect(fetch).toHaveBeenCalled();
    });

    it('should return custom fetch function with specified timeout when a proxy URL and timeout value is provided', async () => {
      vi.mocked(getEnv, { partial: true }).mockReturnValue({ HTTP_PROXY_TLS_TIMEOUT: 1000 });
      vi.mocked(fetch, { partial: true }).mockResolvedValue({ status: 200 });

      const proxyUrl = 'http://proxy.example.com';
      const fetchFn = getFetchFn(proxyUrl, 2000);
      expect(fetchFn).not.toBe(global.fetch);

      await fetchFn('https://api.example.com');
      expect(ProxyAgent).toHaveBeenCalledWith({ uri: proxyUrl, proxyTls: { timeout: 2000 } });
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('instrumentedFetch', () => {
    vi.mock('~/services/instrumentation-service.server', () => ({
      getInstrumentationService: vi.fn().mockReturnValue({
        countHttpStatus: vi.fn(),
      }),
    }));

    it('should successfully fetch and count HTTP status', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ status: 200 });
      const response = await instrumentedFetch(fetchFn, 'test_prefix', 'https://example.com');

      expect(response.status).toBe(200);
      expect(getInstrumentationService().countHttpStatus).toHaveBeenCalledWith('test_prefix', 200);
    });

    it('should handle different HTTP status codes', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ status: 404 });
      const response = await instrumentedFetch(fetchFn, 'test_prefix', 'https://example.com');

      expect(response.status).toBe(404);
      expect(getInstrumentationService().countHttpStatus).toHaveBeenCalledWith('test_prefix', 404);
    });

    it('should handle fetch errors and count 500 status code', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Fetch error'));

      await expect(instrumentedFetch(fetchFn, 'test_prefix', 'https://example.com')).rejects.toThrow('Fetch error');
      expect(getInstrumentationService().countHttpStatus).toHaveBeenCalledWith('test_prefix', 500);
    });
  });
});
