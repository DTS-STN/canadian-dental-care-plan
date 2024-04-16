import { afterEach, describe, expect, it, vi } from 'vitest';

import { error, isConfigured, pageview } from '~/utils/adobe-analytics.client';
import { getClientEnv } from '~/utils/env-utils';

vi.mock('~/utils/env-utils');

describe('error', () => {
  const originalAdobeDataLayer = window.adobeDataLayer;

  afterEach(() => {
    window.adobeDataLayer = originalAdobeDataLayer;
    vi.restoreAllMocks();
  });

  it('does not send an event if window.adobeDataLayer is not defined', () => {
    const spyConsoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => {});

    error(404);

    expect(spyConsoleWarnSpy).toHaveBeenCalledWith('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
  });

  it('sends a error event with the correct error status code', () => {
    window.adobeDataLayer = { push: vi.fn() };

    error(404);

    expect(window.adobeDataLayer.push).toHaveBeenCalledWith({
      event: 'error',
      error: { name: '404' },
    });
  });
});

describe('isConfigured', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true if all necessary environment variables are present and are valid URLs', () => {
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({
      ADOBE_ANALYTICS_JQUERY_SRC: 'http://example.com/jquery.min.js',
      ADOBE_ANALYTICS_SRC: 'http://example.com/adobe-analytics.min.js',
    });
    const result = isConfigured();
    expect(result).toBe(true);
  });

  it('should return false if ADOBE_ANALYTICS_SRC is missing', () => {
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({
      ADOBE_ANALYTICS_JQUERY_SRC: 'http://example.com/jquery.min.js',
    });
    const result = isConfigured();
    expect(result).toBe(false);
  });

  it('should return false if ADOBE_ANALYTICS_JQUERY_SRC is not a valid URL', () => {
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({
      ADOBE_ANALYTICS_JQUERY_SRC: 'invalid-url',
      ADOBE_ANALYTICS_SRC: 'http://example.com/adobe-analytics.min.js',
    });
    const result = isConfigured();
    expect(result).toBe(false);
  });

  it('should return false if ADOBE_ANALYTICS_SRC is not a valid URL', () => {
    vi.mocked(getClientEnv, { partial: true }).mockReturnValue({
      ADOBE_ANALYTICS_JQUERY_SRC: 'http://example.com/jquery.min.js',
      ADOBE_ANALYTICS_SRC: 'invalid-url',
    });
    const result = isConfigured();
    expect(result).toBe(false);
  });
});

describe('pageview', () => {
  const originalAdobeDataLayer = window.adobeDataLayer;

  afterEach(() => {
    window.adobeDataLayer = originalAdobeDataLayer;
    vi.restoreAllMocks();
  });

  it('does not send an event if window.adobeDataLayer is not defined', () => {
    const spyConsoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => {});

    pageview('https://www.example.com');

    expect(spyConsoleWarnSpy).toHaveBeenCalledWith('window.adobeDataLayer is not defined. This could mean your adobe analytics script has not loaded on the page yet.');
  });

  it('sends a pageLoad event with the correct URL', () => {
    window.adobeDataLayer = { push: vi.fn() };

    pageview('https://www.example.com/about-us');

    expect(window.adobeDataLayer.push).toHaveBeenCalledWith({
      event: 'pageLoad',
      page: { url: 'www.example.com/about-us' },
    });
  });
});
