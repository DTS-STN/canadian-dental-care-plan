/**
 * An API route that can be used to perform actions with user's server-side session.
 */
import type { ActionFunctionArgs } from '@remix-run/node';
import { json, redirectDocument } from '@remix-run/node';

import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { getApiSessionRedirectToUrl } from '~/utils/api-session-utils.server';
import { APP_LOCALES } from '~/utils/locale-utils';
import { getLogger } from '~/utils/logging.server';

const API_SESSION_ACTIONS = ['end', 'extend'] as const;
export type ApiSessionAction = (typeof API_SESSION_ACTIONS)[number];

const API_SESSION_REDIRECT_TO_OPTIONS = ['cdcp-website', 'cdcp-website-apply', 'cdcp-website-status'] as const;
export type ApiSessionRedirectTo = (typeof API_SESSION_REDIRECT_TO_OPTIONS)[number];

export async function action({ context: { appContainer, session }, request }: ActionFunctionArgs) {
  const log = getLogger('routes/api/session');
  const sessionId = session.id;
  log.debug("Action with user's server-side session; sessionId: [%s]", sessionId);

  if (request.method !== 'POST') {
    log.warn('Invalid method requested [%s]; responding with 405; sessionId: [%s]', request.method, sessionId);
    throw json({ message: 'Method not allowed' }, { status: 405 });
  }

  const bodySchema = z.object({
    action: z.enum(API_SESSION_ACTIONS),
    locale: z.enum(APP_LOCALES).optional() satisfies z.ZodType<AppLocale | null | undefined>,
    redirectTo: z.enum(API_SESSION_REDIRECT_TO_OPTIONS).optional(),
  });

  const requestBody = await request.json();
  const parsedBody = bodySchema.safeParse(requestBody);

  if (!parsedBody.success) {
    log.debug('Invalid request body [%j]; sessionId: [%s]', requestBody, sessionId);
    return json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
  }

  const { action, locale = 'en', redirectTo } = parsedBody.data;

  switch (action) {
    case 'end': {
      log.debug("Ending user's server-side session; sessionId: [%s], locale: [%s], redirectTo: [%s]", sessionId, locale, redirectTo);
      const sessionService = appContainer.get(TYPES.web.services.SessionService);
      const headers = { 'Set-Cookie': await sessionService.destroySession(session) };

      if (redirectTo) {
        const redirectToUrl = getApiSessionRedirectToUrl(redirectTo, locale);
        return redirectDocument(redirectToUrl, { headers });
      }

      return new Response(null, { headers, status: 204 });
    }

    case 'extend': {
      log.debug("Extending user's server-side session lifetime; sessionId: [%s]", sessionId);
      return new Response(null, { status: 204 });
    }

    default: {
      throw Error(`Action '${parsedBody.data.action}' not implemented; sessionId: [${sessionId}]`);
    }
  }
}
