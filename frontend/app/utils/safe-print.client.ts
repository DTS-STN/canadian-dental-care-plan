/**
 * Safely invokes `window.print()`, detecting environments where
 * printing is unavailable, throws, or silently does nothing.
 *
 * Uses the `beforeprint` event to detect whether the print dialog
 * was actually triggered. In most desktop browsers, `window.print()`
 * is synchronous and blocks until the dialog is closed, so `beforeprint`
 * will have fired by the time execution continues. For browsers where
 * it may be asynchronous (e.g., Safari), a 500ms timeout is used as
 * a fallback to detect silent no-ops (common in in-app WebViews).
 *
 * @param onUnavailable - Optional callback invoked when printing is
 *   not available or failed. May be called asynchronously (up to 500ms
 *   after invocation) in environments where `window.print()` is a
 *   silent no-op.
 */
export function safePrint(onUnavailable?: () => void): void {
  if (typeof window === 'undefined' || typeof window.print !== 'function') {
    onUnavailable?.();
    return;
  }

  let printDialogOpened = false;
  let listenerRegistered = false;

  const onBeforePrint = () => {
    printDialogOpened = true;
    listenerRegistered = false;
  };

  const cleanupBeforePrintListener = () => {
    if (listenerRegistered) {
      window.removeEventListener('beforeprint', onBeforePrint);
      listenerRegistered = false;
    }
  };

  try {
    window.addEventListener('beforeprint', onBeforePrint, { once: true });
    listenerRegistered = true;

    window.print();

    setTimeout(() => {
      cleanupBeforePrintListener();
      if (!printDialogOpened) {
        onUnavailable?.();
      }
    }, 500);
  } catch (error) {
    cleanupBeforePrintListener();
    console.error('safePrint: window.print() threw an error.', error);
    onUnavailable?.();
  }
}
