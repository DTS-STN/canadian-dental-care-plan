import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { z } from 'zod';

import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { createLangCookie } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';

const logger = getLogger('routes/api.switch-language');
const switchLanguageDataSchema = z.object({ language: z.enum(['en', 'fr']) });

export type SwitchLanguageData = z.infer<typeof switchLanguageDataSchema>;

/**
 * A loader function that always throws a 405 Method Not Allowed response.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  logger.warn(`Method Not Allowed: The requested method (${request.method}) is not allowed for this resource. Allowed methods: PUT.`);
  throw json({ error: 'Method Not Allowed', message: 'The requested method is not allowed for this resource. Allowed methods: PUT.' }, { status: 405 });
}

/**
 * Action function to handle the language switch request.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'PUT') {
    logger.warn(`Method Not Allowed: The requested method (${request.method}) is not allowed for this resource. Allowed methods: PUT.`);
    throw json({ error: 'Method Not Allowed', message: 'The requested method is not allowed for this resource. Allowed methods: PUT.' }, { status: 405 });
  }

  const contentType = request.headers.get('Content-Type');

  if (contentType !== 'application/json') {
    logger.warn(`Unsupported Media Type: The server cannot process the request because the content type of the request entity (${contentType}) is not supported. Supported media type: application/json.`);
    throw json({ error: 'Unsupported Media Type', message: 'The server cannot process the request because the content type of the request entity is not supported. Supported media type: application/json.' }, { status: 415 });
  }

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  getInstrumentationService().createCounter('switch-language.requests').add(1);

  const data = await request.json();
  const parsedData = switchLanguageDataSchema.safeParse(data);

  if (!parsedData.success) {
    logger.warn(`Bad Request: Invalid JSON format: ${parsedData.error}`);
    getInstrumentationService().createCounter('switch-language.requests.failed').add(1);

    return json({ error: parsedData.error.format() }, { status: 400 });
  }

  const { language } = parsedData.data;
  logger.debug(`Switching language cookie to "${language}".`);
  getInstrumentationService().createCounter(`switch-language.requests.${language}`).add(1);

  return new Response(null, {
    headers: { 'Set-Cookie': await createLangCookie().serialize(language) },
    status: 204,
  });
}
