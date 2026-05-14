import type { ComponentProps } from 'react';
import { useState } from 'react';

import { Button } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { safePrint } from '~/utils/safe-print.client';

type PrintButtonProps = OmitStrict<ComponentProps<typeof Button>, 'onClick'> & {
  errorMessage: string;
};

/**
 * A print button component that safely handles printing with graceful
 * error handling for environments where `window.print()` is unavailable
 * or silently fails (e.g., in-app WebViews).
 *
 * Displays a danger alert with the provided `errorMessage` when printing
 * is not available. The wrapping `<div>` receives the `className` prop
 * so that both the button and the error alert can be hidden together
 * (e.g., using `print:hidden`).
 *
 * @example
 * ```tsx
 * <PrintButton
 *   className="px-12 print:hidden"
 *   size="lg"
 *   variant="primary"
 *   errorMessage={t(($) => $.confirm.printUnavailable)}
 *   data-gc-analytics-customclick="..."
 * >
 *   {t(($) => $.confirm.printBtn)}
 * </PrintButton>
 * ```
 */
export function PrintButton({ className, children, errorMessage, ...props }: PrintButtonProps) {
  const [printError, setPrintError] = useState(false);

  return (
    <div className={className}>
      <Button
        onClick={() => {
          setPrintError(false);
          safePrint(() => setPrintError(true));
        }}
        {...props}
      >
        {children}
      </Button>
      {printError && (
        <ContextualAlert type="danger">
          <p>{errorMessage}</p>
        </ContextualAlert>
      )}
    </div>
  );
}
