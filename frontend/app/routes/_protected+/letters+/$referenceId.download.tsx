import type { LoaderFunctionArgs } from '@remix-run/node';

import { getCCTService } from '~/services/cct-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('_gcweb-app.letters.$referenceId.download');

export async function loader({ params, request }: LoaderFunctionArgs) {
  if (!featureEnabled('view-letters')) {
    throw new Response('Not Found', { status: 404 });
  }

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userId = await getUserService().getUserId();

  const cctService = getCCTService();
  if (!params.referenceId) {
    throw new Response(null, { status: 400 });
  }
  const pdfResponse = await cctService.getPdf(userId, params.referenceId);

  if (pdfResponse.status === 404) {
    throw new Response(null, { status: 404 });
  }

  if (pdfResponse.ok) {
    return new Response(pdfResponse.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfResponse.headers.get('Content-Length') ?? '',
        'Content-Disposition': `inline; filename="${params.referenceId}.pdf"`,
      },
    });
  }

  log.error('%j', {
    message: 'Failed to fetch data',
    status: pdfResponse.status,
    statusText: pdfResponse.statusText,
    url: pdfResponse.url,
    handlersresponseBody: await pdfResponse.text(),
  });

  throw new Error(`Failed to fetch data. Status: ${pdfResponse.status}, Status Text: ${pdfResponse.statusText}`);
}
