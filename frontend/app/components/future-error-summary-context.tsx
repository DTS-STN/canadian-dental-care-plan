import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

interface ErrorMessage {
  /** The ID of the input field associated with the error. */
  fieldId: string;
  /** The error message to be displayed. */
  message: string;
}

interface ErrorSummaryContextValue {
  /** The list of error messages currently stored in the context. */
  errors: ErrorMessage[];
  /** A function to add a new error message to the context. */
  pushError: (error: ErrorMessage) => void;
  /** A function to commit the collected errors to the context state. */
  commitErrors: () => void;
}

/**
 * A context for managing error messages in a form.
 */
const ErrorSummaryContext = createContext<ErrorSummaryContextValue | undefined>(undefined);

/**
 * A custom hook to access the `ErrorSummaryContext`.
 *
 * This hook provides access to the context values managed by the `ErrorSummaryProvider`.
 * It ensures that the hook is used within the appropriate provider component.
 *
 * @returns The context value from `ErrorSummaryContext`.
 * @throws {Error} If the hook is used outside of an `ErrorSummaryProvider`.
 */
export const useErrorSummaryContext = () => {
  const ctx = useContext(ErrorSummaryContext);
  if (!ctx) throw new Error('useErrorSummaryContext must be used within ErrorSummaryProvider');
  return ctx;
};

export interface ErrorSummaryProviderProps {
  children: React.ReactNode;
  actionData: unknown;
}

/**
 * A context provider that manages a list of error messages for an error summary component.
 * It uses a transaction-based approach to collect errors from child components during a render cycle
 * and commit them to state in a batch, preventing unnecessary re-renders.
 *
 * @remarks
 * This component monitors `actionData` changes to initiate a new error collection transaction.
 * Child components can use `pushError` to register errors, and the internal `ErrorSummaryCommitter`
 * triggers `commitErrors` to finalize the list of errors for display.
 *
 * @param props - The component props.
 * @param props.children - The child components that will have access to the error summary context.
 * @param props.actionData - Data from a form action or similar source. Changes to this prop trigger a reset of the error buffer.
 *
 * @returns A provider component wrapping the children with the ErrorSummaryContext.
 */
export function ErrorSummaryProvider({ children, actionData }: ErrorSummaryProviderProps): JSX.Element {
  const [errors, setErrors] = useState<ErrorMessage[]>([]);
  const transactionBuffer = useRef<ErrorMessage[] | null>(null);
  const lastActionData = useRef(actionData);

  // Start a new transaction when actionData changes
  // Use useLayoutEffect to ensure this runs before paint
  useLayoutEffect(() => {
    if (lastActionData.current !== actionData) {
      transactionBuffer.current = [];
      lastActionData.current = actionData;
    }
  }, [actionData]);

  // Function to push an error into the transaction buffer
  const pushError = useCallback((error: ErrorMessage) => {
    if (transactionBuffer.current) {
      transactionBuffer.current.push(error);
    }
  }, []);

  // Function to commit errors from the transaction buffer to state
  const commitErrors = useCallback(() => {
    if (transactionBuffer.current) {
      setErrors([...transactionBuffer.current]);
      transactionBuffer.current = null;
    }
  }, []);

  return (
    <ErrorSummaryContext.Provider value={{ errors, pushError, commitErrors }}>
      {children}
      <ErrorSummaryCommitter />
    </ErrorSummaryContext.Provider>
  );
}

/**
 * A component that commits errors to the error summary context on every render.
 *
 * This component uses the `useErrorSummaryContext` hook to access the `commitErrors`
 * function and triggers it via a `useEffect` hook without dependencies, causing it
 * to run after every render cycle.
 *
 * @remarks
 * This component is part of an unstable API and may change in future versions.
 * The `useEffect` hook intentionally has no dependency array, causing `commitErrors`
 * to be called on every render.
 *
 * @returns `undefined` - This component does not render any UI elements.
 *
 * @example
 * ```tsx
 * <ErrorSummaryCommitter />
 * ```
 */
function ErrorSummaryCommitter(): undefined {
  const { commitErrors } = useErrorSummaryContext();

  // Intentionally no dependency array to commit errors on every render
  useEffect(() => {
    commitErrors();
  });

  // This component does not render anything
  return undefined;
}
