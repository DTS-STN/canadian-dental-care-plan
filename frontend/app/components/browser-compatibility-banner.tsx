import type { JSX } from 'react';

import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

interface BrowserCompatibilityBannerProps {
  onDismiss?: () => void;
}

export function BrowserCompatibilityBanner({ onDismiss }: BrowserCompatibilityBannerProps): JSX.Element | undefined {
  const { t } = useTranslation(['gcweb']);

  return (
    <div id="browser-compatibility-banner" className="bg-red-50 shadow-md" role="alert">
      <div className="container">
        <div className="flex items-stretch">
          <div className="hidden items-center bg-red-200 p-4 sm:flex">
            <FontAwesomeIcon icon={faCircleExclamation} className="size-6 shrink-0 text-red-700" />
          </div>
          <div className="grow space-y-2 py-4 pl-4">
            <h2 className="font-lato font-bold">{t('gcweb:browser-compatibility-banner.title')}</h2>
            <p>{t('gcweb:browser-compatibility-banner.content')}</p>
            <div className="text-right">
              <button type="button" onClick={onDismiss} className="font-lato rounded-sm border border-red-300 px-3 py-2 text-sm text-red-700 outline-offset-4 hover:border-red-400 hover:bg-red-100 focus:border-red-400 focus:bg-red-100">
                {t('gcweb:browser-compatibility-banner.dismiss')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
