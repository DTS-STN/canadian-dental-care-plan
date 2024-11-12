import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * A basic readiness endpoint to be used by kubernetes container probes
 *
 * @see https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-readiness-probes
 */
export function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  return { ready: true };
}
