import type { LoaderFunctionArgs } from '@remix-run/node';

import { getCCTService } from '~/services/cct-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { UserinfoToken } from '~/utils/raoidc-utils.server';

const log = getLogger('_gcweb-app.letters.$referenceId.download');

export async function loader({ params, request }: LoaderFunctionArgs) {
  if (!featureEnabled('view-letters')) {
    throw new Response('Not Found', { status: 404 });
  }

  const instrumentationService = getInstrumentationService();

  if (!params.referenceId) {
    instrumentationService.countHttpStatus('letters.download', 400);
    throw new Response(null, { status: 400 });
  }

  const cctService = getCCTService();
  const raoidcService = await getRaoidcService();
  const sessionService = await getSessionService();

  await raoidcService.handleSessionValidation(request);

  const session = await sessionService.getSession(request);
  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const response = await cctService.getPdf(userInfoToken.sub, params.referenceId);

  if (!response.ok) {
    if (response.status === 404) {
      instrumentationService.countHttpStatus('letters.download', 404);
      throw new Response(null, { status: 404 });
    }

    log.error('%j', {
      message: 'Failed to fetch data',
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      handlersresponseBody: await response.text(),
    });

    instrumentationService.countHttpStatus('letters.download', 500);
    throw new Error(`Failed to fetch data. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  instrumentationService.countHttpStatus('letters.download', 200);

  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': response.headers.get('Content-Length') ?? '',
      'Content-Disposition': `inline; filename="${params.referenceId}.pdf"`,
    },
  });
}
