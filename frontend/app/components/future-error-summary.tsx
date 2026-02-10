import { useEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef, JSX } from 'react';

import { useTranslation } from 'react-i18next';

import { AnchorLink } from '~/components/anchor-link';
import { useErrorSummaryContext } from '~/components/future-error-summary-context';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { cn } from '~/utils/tw-utils';

/**
 * A component that displays a summary of error messages.
 *
 * This component retrieves error messages from the error summary context
 * using the `useErrorSummaryContext` hook. If there are any errors, it renders
 * a section containing a header and a list of error messages, each linked to
 * the corresponding field using the `AnchorLink` component.
 *
 * Additionally, when errors are present, the component scrolls into view and
 * focuses itself for accessibility. It also sends validation error events to
 * Adobe Analytics if it is configured.
 *
 * @returns A JSX element rendering the error summary section, or `undefined`
 *          if there are no errors to display.
 */
export function ErrorSummary({ className, ...props }: OmitStrict<ComponentPropsWithoutRef<'section'>, 'children' | 'tabIndex'>): JSX.Element | undefined {
  const { t } = useTranslation(['gcweb']);
  const errorSummaryContext = useErrorSummaryContext();
  const summaryRef = useRef<HTMLDivElement>(null);
  const errors = errorSummaryContext?.errors;

  useEffect(() => {
    if (errors && errors.length > 0 && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth' });
      summaryRef.current.focus();

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = errors.map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errors]);

  if (!errors || errors.length === 0) {
    return undefined;
  }

  return (
    <section ref={summaryRef} tabIndex={-1} className={cn('my-5 border-4 border-red-600 p-4', className)} {...props}>
      <h2 className="font-lato text-lg font-semibold">{t('gcweb:error-summary.header', { count: errors.length })}</h2>
      <ul className="mt-1.5 list-disc space-y-2 pl-7">
        {errors.map(({ fieldId, message }) => (
          <li key={`${fieldId}-${message}`}>
            <AnchorLink className="text-red-700 underline hover:decoration-2 focus:decoration-2" anchorElementId={fieldId}>
              {message}
            </AnchorLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
