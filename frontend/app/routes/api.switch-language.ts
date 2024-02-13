import { type ActionFunctionArgs, json } from '@remix-run/node';

import { z } from 'zod';

import { getRaoidcService } from '~/services/raoidc-service.server';
import { createLangCookie } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';

const logger = getLogger('routes/api.switch-language');

const switchLanguageDataSchema = z.object({
  language: z.enum(['en', 'fr']),
});

export type SwitchLanguageData = z.infer<typeof switchLanguageDataSchema>;

/**
 * A loader function that always throws a 405 Method Not Allowed response.
 */
export async function loader() {
  logger.warn(`Method Not Allowed: The requested method (GET) is not allowed for this resource. Allowed methods: PUT.`);
  throw json(
    {
      error: 'Method Not Allowed',
      message: 'The requested method is not allowed for this resource. Allowed methods PUT.',
    },
    { status: 405 },
  );
}

/**
 * Action function to handle the language switch request.
 *
 * @param {ActionFunctionArgs} args - The action function arguments.
 * @returns {Promise<Response>} A promise that resolves to the language switch response.
 *
 * @example
 * const request = //... create a request object
 * const response = await action({ request });
 * console.log(response.status); // Output: 204
 *
 * @param {ActionFunctionArgs} args - The action function arguments.
 */
export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  if (request.method !== 'PUT') {
    logger.warn(`Method Not Allowed: The requested method (${request.method}) is not allowed for this resource. Allowed methods: PUT.`);
    throw json(
      {
        error: 'Method Not Allowed',
        message: 'The requested method is not allowed for this resource. Allowed methods PUT.',
      },
      { status: 405 },
    );
  }

  const contentType = request.headers.get('Content-Type');
  if (contentType !== 'application/json') {
    logger.warn(`Unsupported Media Type: The server cannot process the request because the content type of the request entity (${contentType}) is not supported. Supported media type: application/json.`);
    throw json(
      {
        error: 'Unsupported Media Type',
        message: 'The server cannot process the request because the content type of the request entity is not supported. Supported media type: application/json.',
      },
      { status: 415 },
    );
  }

  const data = await request.json();
  const parsedData = switchLanguageDataSchema.safeParse(data);

  if (!parsedData.success) {
    logger.warn(`Bad Request: Invalid JSON format: ${parsedData.error}`);
    return json({ error: parsedData.error.format() }, { status: 400 });
  }

  const { language } = parsedData.data;
  const langCookie = await createLangCookie().serialize(language);

  logger.debug(`Switching language cookie to "${language}".`);

  return new Response(null, {
    headers: { 'Set-Cookie': langCookie },
    status: 204,
  });
}
