import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';

import { BrowserCompatibilityBanner } from '~/components/browser-compatibility-banner';
import { useBrowserCompatibilityBannerStorage } from '~/hooks';
import { useBrowserValidation } from '~/hooks/use-browser-validation';

export function useBrowserCompatiblityBanner(): undefined | JSX.Element {
  const validationResult = useBrowserValidation();
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const { enabled: browserCompatibilityBannerEnabled, value: browserCompatibilityBannerStorageValue, set: setBrowserCompatibilityBannerStorageValue } = useBrowserCompatibilityBannerStorage();

  useEffect(() => {
    if (validationResult.status !== 'success') {
      setIsBannerVisible(false);
      return;
    }

    if (validationResult.data.isValidBrowser) {
      setIsBannerVisible(false);
      return;
    }

    setIsBannerVisible(browserCompatibilityBannerEnabled && browserCompatibilityBannerStorageValue !== 'dismissed');
  }, [browserCompatibilityBannerEnabled, browserCompatibilityBannerStorageValue, validationResult.data?.isValidBrowser, validationResult.status]);

  const handleDismiss = useCallback(() => {
    setIsBannerVisible(false);
    setBrowserCompatibilityBannerStorageValue('dismissed');
  }, [setBrowserCompatibilityBannerStorageValue]);

  if (!isBannerVisible) {
    return;
  }

  return <BrowserCompatibilityBanner onDismiss={handleDismiss} />;
}
