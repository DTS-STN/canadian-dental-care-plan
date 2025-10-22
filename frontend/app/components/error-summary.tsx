import { useCallback, useEffect, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { useDeepCompareMemo } from 'use-deep-compare';
import validator from 'validator';

import { AnchorLink } from '~/components/anchor-link';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { scrollAndFocusFromAnchorLink } from '~/utils/link-utils';

/**
 * Represents an item in an error summary, containing information about
 * an error message and the associated field ID where the error occurred.
 */
export interface ErrorSummaryItem {
  errorMessage: string;
  fieldId: string;
}

/**
 * Creates an ErrorSummaryItem with the specified field ID and error message.
 *
 * @param fieldId - The field ID where the error occurred.
 * @param errorMessage - The error message describing the issue.
 * @returns An object of type ErrorSummaryItem.
 */
export function createErrorSummaryItem(fieldId: string, errorMessage: string) {
  return {
    errorMessage,
    fieldId,
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
      if (!value) return;
      return createErrorSummaryItem(key, value);
    })
    .filter((item) => item !== undefined);
}

/**
 * Checks if there are any errors in the provided object by examining the
 * existence and truthiness of error messages associated with field IDs.
 *
 * @param obj - A record containing field IDs and associated error messages.
 * @returns True if there are errors, false otherwise.
 */
export function hasErrors(obj: Record<string, unknown>) {
  return Object.keys(obj)
    .map((key) => obj[key])
    .some(Boolean);
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
    <section id={id} className="my-5 border-4 border-red-600 p-4" tabIndex={-1}>
      <h2 className="font-lato text-lg font-semibold">{t('gcweb:error-summary.header', { count: errors.length })}</h2>
      {errors.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-2 pl-7">
          {errors.map(({ fieldId, errorMessage }) => (
            <li key={`${fieldId}-${errorMessage}`}>
              <AnchorLink className="text-red-700 underline hover:decoration-2 focus:decoration-2" anchorElementId={fieldId}>
                {errorMessage}
              </AnchorLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Type guard to check if a value is a record with string keys
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Field mapping configuration that supports nested array fields
 */
export interface ErrorFieldMap {
  [key: string]: string | ((index: number) => string);
}

/**
 * Custom hook to generate error summary items based on provided errors and field mappings,
 * and handle side effects such as scrolling to the error summary and pushing analytics events.
 * This version supports nested array errors like documentTypes[index].
 *
 * @param errors - Object containing error messages keyed by field names. Can include nested array errors.
 * @param errorFieldMap - Object mapping field names (from errors) to corresponding field IDs or field ID generators for arrays.
 * @param errorSummaryId - ID attribute for the error summary container.
 */
export function useErrorSummary(errors: Record<string, unknown> | undefined, errorFieldMap: ErrorFieldMap, errorSummaryId: string = 'error-summary') {
  // Memoize `errorFieldMap` based on its content to trigger useMemo only if the content changes
  const memoizeErrorFieldMap = useDeepCompareMemo(() => errorFieldMap, [errorFieldMap]);

  const errorSummaryItems = useMemo<ErrorSummaryItem[]>(() => {
    if (!errors) return [];

    const items: ErrorSummaryItem[] = [];

    for (const key of Object.keys(memoizeErrorFieldMap)) {
      const fieldMapping = memoizeErrorFieldMap[key];
      const errorValue = errors[key];

      // Handle array errors (like documentTypes)
      if (isRecord(errorValue)) {
        // This is an object with indexed errors (e.g., documentTypes: { 0: 'error1', 1: 'error2' })
        for (const index in errorValue) {
          const errorMessage = errorValue[index];
          if (isString(errorMessage) && !validator.isEmpty(errorMessage)) {
            if (typeof fieldMapping === 'function') {
              // Use the field ID generator function for arrays
              const fieldId = fieldMapping(Number.parseInt(index));
              items.push({ errorMessage, fieldId });
            } else if (typeof fieldMapping === 'string') {
              // For simple array field mappings, append the index
              const fieldId = `${fieldMapping}-${index}`;
              items.push({ errorMessage, fieldId });
            }
          }
        }
      }
      // Handle simple string errors
      else if (isString(errorValue) && !validator.isEmpty(errorValue) && typeof fieldMapping === 'string' && !validator.isEmpty(fieldMapping)) {
        items.push({ errorMessage: errorValue, fieldId: fieldMapping });
      }
    }

    return items;
  }, [errors, memoizeErrorFieldMap]);

  useEffect(() => {
    if (errorSummaryItems.length > 0) {
      scrollAndFocusToErrorSummary(errorSummaryId);
      if (adobeAnalytics.isConfigured()) {
        const fieldIds = errorSummaryItems.map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorSummaryId, errorSummaryItems]);

  const errorSummaryComponent = useCallback(() => {
    return errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />;
  }, [errorSummaryId, errorSummaryItems]);

  return {
    errorSummaryId,
    errorSummaryItems,
    ErrorSummary: errorSummaryComponent,
  };
}
