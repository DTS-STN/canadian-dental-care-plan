import { useTranslation } from 'react-i18next';

import { AnchorLink } from '~/components/anchor-link';
import { scrollAndFocusFromAnchorLink } from '~/utils/link-utils';

/**
 * Represents an item in an error summary, containing information about
 * an error message and the associated field ID where the error occurred.
 */
export interface ErrorSummaryItem {
  errorMessage: string;
  feildId: string;
}

/**
 * Creates an ErrorSummaryItem with the specified field ID and error message.
 *
 * @param feildId - The field ID where the error occurred.
 * @param errorMessage - The error message describing the issue.
 * @returns An object of type ErrorSummaryItem.
 */
export function createErrorSummaryItem(feildId: string, errorMessage: string) {
  return {
    errorMessage,
    feildId,
  } as const satisfies ErrorSummaryItem;
}

/**
 * Creates an array of ErrorSummaryItems based on the provided object, which
 * represents field IDs and their associated error messages.
 *
 * @param obj - A record containing field IDs and associated error messages.
 * @returns An array of ErrorSummaryItems.
 */
export function createErrorSummaryItems(obj: Record<string, string | undefined>) {
  return Object.keys(obj)
    .map((key) => {
      const value = obj[key];
      if (!value) return undefined;
      return createErrorSummaryItem(key, value);
    })
    .filter((item): item is ErrorSummaryItem => item !== undefined);
}

/**
 * Checks if there are any errors in the provided object by examining the
 * existence and truthiness of error messages associated with field IDs.
 *
 * @param obj - A record containing field IDs and associated error messages.
 * @returns True if there are errors, false otherwise.
 */
export function hasErrors(obj: Record<string, string | undefined>) {
  return (
    obj &&
    Object.keys(obj)
      .map((key) => obj[key])
      .filter(Boolean).length > 0
  );
}

/**
 * Scrolls the page to the specified error summary section identified by the given errorSummaryId
 * and focuses on it by updating the URL hash accordingly.
 *
 * @param errorSummaryId - The identifier of the error summary section to scroll and focus on.
 */
export function scrollAndFocusToErrorSummary(errorSummaryId: string) {
  // Create a new URL object based on the current window location
  const url = new URL(window.location.href);

  // Update the URL hash to point to the specified errorSummaryId
  url.hash = errorSummaryId;

  // Use the scrollAndFocusFromAnchorLink function to handle scrolling and focusing
  scrollAndFocusFromAnchorLink(url.toString());
}

/**
 * Props for the ErrorSummary component.
 */
export interface ErrorSummaryProps {
  errors: ErrorSummaryItem[];
  id: string;
}

/**
 * ErrorSummary component displays a list of errors with associated field IDs
 * and provides anchor links for users to navigate to specific error messages.
 */
export function ErrorSummary({ errors, id }: ErrorSummaryProps) {
  const { t } = useTranslation(['gcweb']);

  return (
    <section id={id} className="my-5 flex rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 " tabIndex={-1} role="alert">
      <svg className="me-3 mt-1 inline h-4 w-4 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
      </svg>
      <div>
        <h2 className="text-lg font-semibold">{t('gcweb:error-summary.header', { count: errors.length })}</h2>
        {errors.length > 0 && (
          <ul className="mt-1.5 list-inside list-disc">
            {errors.map(({ feildId, errorMessage }) => (
              <li key={feildId}>
                <AnchorLink className="hover:underline" anchorElementId={feildId}>
                  {errorMessage}
                </AnchorLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
