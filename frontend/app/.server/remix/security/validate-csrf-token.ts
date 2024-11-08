import type { ActionFunctionArgs } from '@remix-run/node';

import type { PickDeep } from 'type-fest';

import { TYPES } from '~/.server/constants';
import { CsrfTokenInvalidException } from '~/.server/web/exceptions';

/**
 * Validates the CSRF token in the request.
 *
 * This function is typically used as a middleware in Remix action functions to protect against
 * Cross-Site Request Forgery (CSRF) attacks. It retrieves the CSRF token validator from the
 * application context and uses it to validate the token present in the incoming request.
 *
 * If the token is invalid, it throws a `CsrfTokenInvalidException`, which is caught and
 * translated into a 403 Forbidden response. Any other errors during validation are re-thrown.
 *
 * **Usage in Remix Action:**
 *
 * ```typescript
 * import { json } from 'remix';
 * import { validateCsrfToken } from '~/.server/remix/security';
 *
 * export const action = async ({ request, context }: ActionFunctionArgs) => {
 *   // Validate CSRF token first
 *   await validateCsrfToken({ context, request });
 *
 *   // ... process the request and return a response
 *   return json({ success: true });
 * };
 * ```
 */
export async function validateCsrfToken({ context, request }: PickDeep<ActionFunctionArgs, 'context.appContainer' | 'request'>): Promise<void> {
  try {
    const csrfTokenValidator = context.appContainer.get(TYPES.Web_CsrfTokenValidator);
    await csrfTokenValidator.validateCsrfToken(request);
  } catch (err) {
    if (err instanceof CsrfTokenInvalidException) {
      throw new Response('Invalid CSRF token', { status: 403 });
    }
    throw err;
  }
}
