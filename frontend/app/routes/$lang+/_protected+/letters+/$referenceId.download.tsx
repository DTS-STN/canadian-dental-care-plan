import type { LoaderFunctionArgs } from '@remix-run/node';

import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLettersService } from '~/services/letters-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { UserinfoToken } from '~/utils/raoidc-utils.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
  featureEnabled('view-letters');

  const instrumentationService = getInstrumentationService();

  if (!params.referenceId) {
    instrumentationService.countHttpStatus('letters.download', 400);
    throw new Response(null, { status: 400 });
  }

  const lettersService = getLettersService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const response = await lettersService.getPdf(userInfoToken.sub, params.referenceId);

  if (!response.ok) {
    if (response.status === 404) {
      instrumentationService.countHttpStatus('letters.download', 404);
      throw new Response(null, { status: 404 });
    }
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
