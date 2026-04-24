import { useEffect, useState } from 'react';

import Bowser from 'bowser';

/**
 * Default minimum supported browser versions.
 *
 * These values are passed to Bowser's `satisfies` method to determine whether
 * the current browser meets the application's minimum supported versions.
 * Adjust these values as the application's support policy changes.
 *
 * See Bowser `satisfies` docs: https://github.com/bowser-js/bowser#filtering-browsers
 */
export const DEFAULT_BROWSER_REQUIREMENTS = {
  chrome: '>=126',
  chromium: '>=126',
  firefox: '>=128',
  safari: '>=15',
  edge: '>=126',
} as const satisfies Bowser.Parser.checkTree;

/**
 * The structured data returned when the browser check succeeds.
 *
 * - `isValidBrowser`: boolean indicating whether the current browser
 *   meets `DEFAULT_BROWSER_REQUIREMENTS`.
 * - `browserInfo`: full Bowser-parsed result for inspection or display.
 */
type BrowserValidationData = {
  isValidBrowser: boolean;
  browserInfo: Bowser.Parser.ParsedResult;
};

/**
 * Union describing the lifecycle states of the hook.
 *
 * - `loading`: initial state while Bowser parses the user agent.
 * - `success`: contains `data` with `BrowserValidationData`.
 * - `failure`: contains an `error` describing what went wrong.
 */
type BrowserValidationResult =
  | { status: 'loading'; data?: undefined; error?: undefined } //
  | { status: 'success'; data: BrowserValidationData; error?: undefined }
  | { status: 'failure'; data?: undefined; error: Error | unknown };

/**
 * useBrowserValidation
 *
 * React hook that evaluates the current browser (via the user agent) against
 * `DEFAULT_BROWSER_REQUIREMENTS` using Bowser.
 *
 * Behavior notes:
 * - This hook uses `useEffect`, so it only runs in the browser and is safe
 *   for server-side rendering: on the server it will remain in `loading`
 *   until hydrated in the browser.
 * - On success the hook returns both a boolean `isValidBrowser` and the
 *   parsed `browserInfo` which can be used to customize messaging or UI.
 * - On failure the hook returns a `failure` state with the thrown error.
 *
 * Example:
 *
 * const result = useBrowserValidation();
 * if (result.status === 'loading') return <Spinner />;
 * if (result.status === 'failure') return <ErrorBanner error={result.error} />;
 * if (result.status === 'success' && !result.data.isValidBrowser) {
 *   return <UnsupportedBrowserBanner info={result.data.browserInfo} />;
 * }
 *
 * @returns {BrowserValidationResult} the current validation status and data.
 */
export function useBrowserValidation(): BrowserValidationResult {
  const [result, setResult] = useState<BrowserValidationResult>({ status: 'loading' });

  useEffect(() => {
    try {
      const parser = Bowser.getParser(window.navigator.userAgent);
      const browserInfo = parser.getResult();
      // Bowser returns `undefined` when the browser is not described by the
      // checkTree; fall back to `true` to avoid false negatives for unknown
      // or new browser identifiers.
      const isValidBrowser = parser.satisfies(DEFAULT_BROWSER_REQUIREMENTS) ?? true;
      setResult({ status: 'success', data: { isValidBrowser, browserInfo } });
    } catch (error) {
      setResult({ status: 'failure', error });
    }
  }, []);

  return result;
}
