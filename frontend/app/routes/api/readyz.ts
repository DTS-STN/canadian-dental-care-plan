import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

/**
 * A basic readiness endpoint to be used by kubernetes container probes
 *
 * @see https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-readiness-probes
 */
export function loader({ context: { configProvider, serviceProvider, session }, request }: LoaderFunctionArgs) {
  return json({ ready: true });
}
