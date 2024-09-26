import { XMLParser } from 'fast-xml-parser';
import moize from 'moize';
import { z } from 'zod';

import { getAuditService } from '~/services/audit-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getFetchFn, instrumentedFetch } from '~/utils/fetch-utils.server';
import { getLogger } from '~/utils/logging.server';
import { expandTemplate } from '~/utils/string-utils';

function createDynatraceService() {
  // prettier-ignore
  const {
    HTTP_PROXY_URL,
    DYNATRACE_API_RUM_SCRIPT_TOKEN,
    DYNATRACE_API_RUM_SCRIPT_URI,
    DYNATRACE_API_RUM_SCRIPT_URI_CACHE_TTL_SECONDS
  } = getEnv();

  const fetchFn = getFetchFn(HTTP_PROXY_URL);

  function generateRetrieveRumScriptUrl() {
    const log = getLogger('dynatrace-service.server/generateRetrieveRumScriptUrl');
    if (DYNATRACE_API_RUM_SCRIPT_URI === undefined) {
      log.debug('DYNATRACE_API_RUM_SCRIPT_URI is undefined; returning undefined');
      return;
    }

    const url = new URL(expandTemplate(DYNATRACE_API_RUM_SCRIPT_URI, { token: DYNATRACE_API_RUM_SCRIPT_TOKEN ?? '' }));
    log.debug('Retrieve RUM Script url is generated; url: [%s]', url);
    return url;
  }

  /**
   * Retrieve Dynatrace RUM Script metadata via Dynatrace API.
   */
  async function retrieveRumScript() {
    const log = getLogger('dynatrace-service.server/retrieveRumScript');
    log.debug('Retrieve RUM Script via Dynatrace API');

    try {
      const auditService = getAuditService();
      auditService.audit('dynatrace-service.retrieve-rum-script.get', { userId: 'anonymous' });

      const retrieveRumScriptUrl = generateRetrieveRumScriptUrl();

      if (retrieveRumScriptUrl === undefined) {
        log.debug('retrieveRumScriptUrl is undefined; returning undefined');
        return;
      }

      const response = await instrumentedFetch(fetchFn, 'http.client.dynatrace-api.retrieve-rum-script.gets', retrieveRumScriptUrl);

      if (!response.ok) {
        log.error('%j', {
          message: "Failed to 'GET' the Dynatrace RUM Script",
          status: response.status,
          statusText: response.statusText,
          url: retrieveRumScriptUrl,
          responseBody: await response.text(),
        });
        return;
      }

      const requestBody = await response.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', allowBooleanAttributes: true });
      const parsedBody = parser.parse(requestBody);

      // script validation schema
      const scriptSchema = z.object({
        script: z.object({
          src: z.string().regex(/^\/\w*\.js$/),
          'data-dtconfig': z.string(),
        }),
      });

      const parsedScript = scriptSchema.safeParse(parsedBody);
      if (!parsedScript.success) {
        log.error('Script tag is invalid; parsedBody: [%j]; error: [%j]', parsedBody, parsedScript.error);
        return;
      }

      const { script } = parsedScript.data;
      log.debug('Script tag is valid; script: [%j]', script);
      return script;
    } catch (error) {
      log.error('Unexpected server error while retrieving RUM Script via Dynatrace API; error: [%j]', error);
      return;
    }
  }

  return {
    retrieveRumScript: moize.promise(retrieveRumScript, {
      maxAge: DYNATRACE_API_RUM_SCRIPT_URI_CACHE_TTL_SECONDS,
      onCacheAdd: () => {
        const log = getLogger('dynatrace-service.server/retrieveRumScript');
        log.info('Creating new retrieveRumScript memo');
      },
    }),
  };
}

/**
 * Return a singleton instance (by means of memomization) of the dynatrace service.
 */
export const getDynatraceService = moize(createDynatraceService, {
  onCacheAdd: () => {
    const log = getLogger('dynatrace-service.server/getDynatraceService');
    log.info('Creating new dynatrace service');
  },
});
