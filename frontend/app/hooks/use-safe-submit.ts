import { useCallback, useRef, useState } from 'react';
import { useNavigation } from 'react-router';

interface UseSafeSubmitOptions {
  /**
   * The submission handler invoked when the form is submitted. The hook holds the lock for the
   * full duration of this callback — if it returns a promise, the lock is released only after
   * the promise settles — preventing concurrent or duplicate submissions.
   *
   * @param event The original form submission event.
   * @param formData The form data extracted from the event.
   */
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>, formData: FormData) => void | Promise<void>;
}

type SafeSubmitResult = {
  /**
   * A submit handler to attach to a `<form>` element's `onSubmit` prop. Calls
   * `preventDefault` and `stopPropagation` on the event, then delegates to the
   * `onSubmit` callback. Concurrent calls are ignored while a submission is in
   * progress.
   *
   * @param event The form submission event.
   */
  handleSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;

  /**
   * `true` while a submission is in progress. Combines this hook's internal latch with React
   * Router's navigation state, so the flag stays `true` for the full duration of a route
   * transition triggered by the submission.
   */
  isSubmitLocked: boolean;
};

/**
 * Provides a safe form submission handler that prevents duplicate or concurrent submissions
 * via a two-layer locking mechanism:
 *
 * 1. **Synchronous ref latch** — blocks a second submit instantly, before any re-render.
 * 2. **Reactive state flag** — triggers re-renders so consumers can disable buttons or show
 *    progress indicators.
 *
 * The returned `isSubmitLocked` also incorporates React Router's `navigation.state` so the
 * lock persists through any resulting route transition.
 *
 * @param options An object containing the `onSubmit` callback.
 * @returns An object containing the `handleSubmit` event handler and the `isSubmitLocked` state.
 */
export function useSafeSubmit({ onSubmit }: UseSafeSubmitOptions): SafeSubmitResult {
  const { state } = useNavigation();
  // Keep the lock active while React Router is processing a navigation triggered by the submission.
  const isSubmitting = state === 'submitting';

  // Synchronous latch: set before any state update so a second submit in the same tick is
  // blocked immediately, without waiting for a re-render.
  const isProcessingSubmission = useRef(false);

  // Mirrors the ref as reactive state so consumers receive re-renders and can update the UI
  // (e.g. disable submit buttons) while a submission is in progress.
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (isProcessingSubmission.current) {
        return;
      }

      isProcessingSubmission.current = true;
      setIsSubmitLocked(true);

      try {
        const formData = new FormData(event.currentTarget);
        await onSubmit(event, formData);
      } finally {
        isProcessingSubmission.current = false;
        setIsSubmitLocked(false);
      }
    },
    [onSubmit],
  );

  return {
    handleSubmit,
    isSubmitLocked: isSubmitLocked || isSubmitting,
  };
}
