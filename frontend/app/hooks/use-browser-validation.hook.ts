import { useEffect, useState } from 'react';

import Bowser from 'bowser';
import { useDeepCompareMemo } from 'use-deep-compare';

export const DEFAULT_BROWSER_REQUIREMENTS = {
  chrome: '>=126',
  chromium: '>=126',
  firefox: '>=128',
  Safari: '>=15',
  edge: '>=126',
} as const satisfies Bowser.Parser.checkTree;

export type BrowserValidationData = {
  isValidBrowser: boolean;
  browserInfo: Bowser.Parser.ParsedResult;
};

export type BrowserValidationResult =
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: BrowserValidationData; error?: undefined }
  | { status: 'failure'; data?: undefined; error: Error | unknown };

/**
 * Custom React hook to validate the current browser against a given Bowser 'satisfies' configuration.
 *
 * @param satisfiesConfig - The configuration object for Bowser's `satisfies` method.
 * See Bowser documentation for syntax: https://github.com/bowser-js/bowser#filtering-browsers
 * @returns A result object with status ('idle', 'loading', 'success', 'failure'), data on success, or error on failure.
 */
export function useBrowserValidation(satisfiesConfig: Bowser.Parser.checkTree = DEFAULT_BROWSER_REQUIREMENTS): BrowserValidationResult {
  const [result, setResult] = useState<BrowserValidationResult>({ status: 'idle' });

  const memoizedConfig = useDeepCompareMemo(() => {
    return satisfiesConfig;
  }, [satisfiesConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setResult({
        status: 'failure',
        error: new Error('Browser environment not available (window is undefined).'),
      });
      return;
    }

    setResult({ status: 'loading' });

    try {
      const parser = Bowser.getParser(window.navigator.userAgent);
      const currentBrowserInfo = parser.getResult();

      // fallback with `true` when the browser is no described in the checkTree object
      const satisfies = parser.satisfies(memoizedConfig) ?? true;

      setResult({
        status: 'success',
        data: {
          isValidBrowser: satisfies,
          browserInfo: currentBrowserInfo,
        },
      });
    } catch (error) {
      setResult({ status: 'failure', error });
    }
  }, [memoizedConfig]);

  return result;
}
