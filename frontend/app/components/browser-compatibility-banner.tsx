import type { JSX } from 'react';

import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { Button } from '~/components/buttons';

interface BrowserCompatibilityBannerProps {
  onDismiss?: () => void;
}

export function BrowserCompatibilityBanner({ onDismiss }: BrowserCompatibilityBannerProps): JSX.Element | undefined {
  const { t } = useTranslation(['gcweb']);

  return (
    <div id="browser-compatibility-banner" className="border-b border-red-700 bg-red-50" role="alert">
      <div className="container">
        <div className="flex items-stretch">
          <div className="hidden items-center bg-red-200 p-4 sm:flex">
            <FontAwesomeIcon icon={faCircleExclamation} className="size-6 shrink-0 text-red-700" />
          </div>
          <div className="p-4">
            <h2 className="font-lato mb-1 font-semibold">{t('gcweb:browser-compatibility-banner.title')}</h2>
            <p>{t('gcweb:browser-compatibility-banner.content')}</p>
            <div className="text-right">
              <Button variant="link" type="button" onClick={onDismiss}>
                {t('gcweb:browser-compatibility-banner.dismiss')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
