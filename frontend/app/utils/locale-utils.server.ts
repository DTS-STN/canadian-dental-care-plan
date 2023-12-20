import { createInstance, type Namespace } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';
import { resolve } from 'node:path';

import { getLocale } from '~/utils/locale-utils';

/**
 * Returns a t function that defaults to the language resolved through the request.
 *
 * @param {Request} request - The request object.
 * @param {Namespace} namespaces - The namespace object (a string, array of strings, or null).
 */
export async function getFixedT<N extends Namespace>(request: Request, namespaces: N) {
  const i18n = createInstance();

  await i18n
    .use(I18NexFsBackend)
    .init({
      backend: { loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json') },
      debug: process.env.NODE_ENV === 'development',
      interpolation: { escapeValue: false },
      lng: getLocale(request.url),
      ns: namespaces,
    });

  return i18n.getFixedT(null, null);
}
