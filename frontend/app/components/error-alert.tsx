import type { PropsWithChildren, ReactNode } from 'react';
import { forwardRef, useCallback, useEffect, useRef } from 'react';

import type { AlertType } from '~/components/contextual-alert';
import { ContextualAlert } from '~/components/contextual-alert';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';

export interface ErrorAlertProps {
  /* Content to be displayed inside the alert */
  children: ReactNode;

  /* ID for the alert (defaults to 'error-alert') */
  id: string;

  /* Type of alert (eg. 'info', 'warning'; defaults to 'danger') */
  type?: AlertType;
}

/**
 * ForwardRef component to display the ErrorAlert with ContextualAlert
 */
export const ErrorAlert = forwardRef<HTMLDivElement, ErrorAlertProps>(({ children, id, type = 'danger' }, ref) => {
  return (
    <section ref={ref} id={id} className="mb-4" tabIndex={-1}>
      <ContextualAlert type={type}>{children}</ContextualAlert>
    </section>
  );
});
ErrorAlert.displayName = 'ErrorAlert';

/**
 * Custom hook for managing the error alert and its focus/scroll behavior
 *
 * @param showErrorAlert Determines if the error alert should be shown. If true, the error alert component will be rendered.
 * @param errorAlertId The optional ID to be assigned to the error alert component used to focus and scroll to the alert (defaults to 'error-alert').
 */
export function useErrorAlert(showErrorAlert: boolean, errorAlertId: string = 'error-alert') {
  const alertRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (alertRef.current && showErrorAlert) {
      alertRef.current.scrollIntoView({ behavior: 'smooth' });
      alertRef.current.focus();
      if (adobeAnalytics.isConfigured()) {
        adobeAnalytics.pushValidationErrorEvent([errorAlertId]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertRef.current, errorAlertId, showErrorAlert]);

  const errorAlertComponent = useCallback(
    ({ children }: PropsWithChildren) => {
      return (
        showErrorAlert && (
          <ErrorAlert id={errorAlertId} ref={alertRef}>
            {children}
          </ErrorAlert>
        )
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alertRef.current, errorAlertId, showErrorAlert],
  );

  return {
    errorAlertId,
    ErrorAlert: errorAlertComponent,
  };
}
