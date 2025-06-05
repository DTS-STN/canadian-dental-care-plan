import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';

import { BrowserCompatibilityBanner } from '~/components/browser-compatibility-banner';
import { useBrowserValidation } from '~/hooks/use-browser-validation.hook';

const BROWSER_COMPATIBILITY_BANNER_STORAGE_KEY = 'browser-compatibility-banner';
const BROWSER_COMPATIBILITY_BANNER_DISMISSED_VALUE = 'dismissed';

export function useBrowserCompatiblityBanner(): undefined | JSX.Element {
  const validationResult = useBrowserValidation();
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  useEffect(() => {
    if (validationResult.status !== 'success') {
      setIsBannerVisible(false);
      return;
    }

    if (validationResult.data.isValidBrowser) {
      setIsBannerVisible(false);
      return;
    }

    // Invalid browser, check if it was dismissed
    const storageValue = sessionStorage.getItem(BROWSER_COMPATIBILITY_BANNER_STORAGE_KEY);
    const dismissed = storageValue === BROWSER_COMPATIBILITY_BANNER_DISMISSED_VALUE;
    setIsBannerVisible(!dismissed);
  }, [validationResult]);

  const handleDismiss = useCallback(() => {
    setIsBannerVisible(false);
    sessionStorage.setItem(BROWSER_COMPATIBILITY_BANNER_STORAGE_KEY, BROWSER_COMPATIBILITY_BANNER_DISMISSED_VALUE);
  }, []);

  if (!isBannerVisible) {
    return;
  }

  return <BrowserCompatibilityBanner onDismiss={handleDismiss} />;
}
