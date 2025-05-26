import type { JSX } from 'react';

import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '~/components/buttons';

interface BrowserCompatibilityBannerProps {
  onDismiss?: () => void;
}

export function BrowserCompatibilityBanner({ onDismiss }: BrowserCompatibilityBannerProps): JSX.Element | undefined {
  return (
    <div id="browser-compatibility-banner" className="border-b border-red-700 bg-red-50" role="alert">
      <div className="container">
        <div className="flex items-stretch">
          <div className="hidden items-center bg-red-200 p-4 sm:flex">
            <FontAwesomeIcon icon={faCircleExclamation} className="size-6 shrink-0 text-red-700" />
          </div>
          <div className="p-4">
            <h2 className="font-lato mb-1 font-semibold">Browser not supported</h2>
            <p>This website is not compatible with you browser. Critical functionalities of this application will likely not work, and you may be unable to perform essential actions or save your work.</p>
            <div className="text-right">
              <Button variant="link" type="button" onClick={onDismiss}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
