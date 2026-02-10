import { useEffect } from 'react';
import type { ComponentProps, JSX } from 'react';

import { useErrorSummaryContext } from '~/components/future-error-summary-context';
import { cn } from '~/utils/tw-utils';

export interface ErrorMessageProps extends OmitStrict<ComponentProps<'div'>, 'children'> {
  fieldId: string;
  message: string;
}

/**
 * A component that displays an error message and registers it with the error summary context.
 *
 * This component renders a styled error message box (red border, light red background) and
 * uses the `useErrorSummaryContext` hook to push the error details (field ID and message)
 * to a central error summary, likely for form validation purposes.
 *
 * @returns A JSX element rendering the error message with `role="alert"`.
 */
export function ErrorMessage({ className, fieldId, message, ...props }: ErrorMessageProps): JSX.Element {
  const errorSummaryContext = useErrorSummaryContext();

  // Register the error message with the context
  // Intentionally no dependency array to push error on every render
  useEffect(() => {
    errorSummaryContext?.pushError({ fieldId, message });
  });

  return (
    <div className={cn('w-fit max-w-prose border-l-2 border-red-600 bg-red-50 px-3 py-1', className)} role="alert" {...props}>
      {message}
    </div>
  );
}
