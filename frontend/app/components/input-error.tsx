import { useEffect } from 'react';
import type { ComponentProps } from 'react';

import { useErrorSummaryContext } from '~/components/future-error-summary-context';
import { cn } from '~/utils/tw-utils';

export interface InputErrorProps extends OmitStrict<ComponentProps<'div'>, 'children'> {
  /** The ID of the input field associated with the error message. */
  fieldId: string;

  /** The error message to be displayed. */
  message: string;
}

export function InputError({ className, fieldId, message, ...props }: InputErrorProps) {
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
