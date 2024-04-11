import { afterEach, describe, expect, it, vi } from 'vitest';

import { pageview } from '~/utils/adobe-analytics.client';

vi.mock('~/utils/url-utils');

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

  it('sends a pageLoad event with the correct UR', () => {
    window.adobeDataLayer = { push: vi.fn() };

    pageview('https://www.example.com/about-us');

    expect(window.adobeDataLayer.push).toHaveBeenCalledWith({
      event: 'pageLoad',
      page: { url: 'www.example.com/about-us' },
    });
  });
});
