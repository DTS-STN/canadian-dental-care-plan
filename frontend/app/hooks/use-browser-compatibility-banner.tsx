import { useCallback } from 'react';
import type { JSX } from 'react';

import { BrowserCompatibilityBanner } from '~/components/browser-compatibility-banner';
import { useBrowserCompatibilityBannerStorage } from '~/hooks';
import { useBrowserValidation } from '~/hooks/use-browser-validation';

export function useBrowserCompatiblityBanner(): undefined | JSX.Element {
  const validationResult = useBrowserValidation();
  const { enabled: browserCompatibilityBannerEnabled, value: browserCompatibilityBannerStorageValue, set: setBrowserCompatibilityBannerStorageValue } = useBrowserCompatibilityBannerStorage();

  const isBannerVisible =
    validationResult.status === 'success' && //
    validationResult.data.isValidBrowser === false &&
    browserCompatibilityBannerEnabled &&
    browserCompatibilityBannerStorageValue !== 'dismissed';

  const handleDismiss = useCallback(() => {
    setBrowserCompatibilityBannerStorageValue('dismissed');
  }, [setBrowserCompatibilityBannerStorageValue]);

  if (!isBannerVisible) {
    return;
  }

  return <BrowserCompatibilityBanner onDismiss={handleDismiss} />;
}
