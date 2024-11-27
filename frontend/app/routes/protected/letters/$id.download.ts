import { data } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

import { Buffer } from 'node:buffer';
import { sanitize } from 'sanitize-filename-ts';

import { TYPES } from '~/.server/constants';
import type { LetterDto } from '~/.server/domain/dtos';
import { getLocale } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';
import { getInstrumentationService } from '~/services/instrumentation-service.server';

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('view-letters');
  await securityHandler.validateAuthSession({ request, session });

  const instrumentationService = getInstrumentationService();

  if (!params.id) {
    instrumentationService.countHttpStatus('letters.download', 400);
    throw data(null, { status: 400 });
  }

  // prevent users from entering any ID in the URL and seeing other users' letters
  const letters: ReadonlyArray<LetterDto> | undefined = session.get('letters');
  const letter = letters?.find((letter) => letter.id === params.id);
  if (!letter) {
    instrumentationService.countHttpStatus('letters.download', 404);
    throw data(null, { status: 404 });
  }

  const locale = getLocale(request);
  const letterType = appContainer.get(TYPES.domain.services.LetterTypeService).getLocalizedLetterTypeById(letter.letterTypeId, locale);
  const documentName = sanitize(letterType.name);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  const pdfBytes = await appContainer.get(TYPES.domain.services.LetterService).getPdfByLetterId({ letterId: params.id, userId: userInfoToken.sub });
  instrumentationService.countHttpStatus('letters.download', 200);

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('download.letter', { userId: idToken.sub });

  const decodedPdfBytes = Buffer.from(pdfBytes, 'base64');
  return new Response(decodedPdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': decodedPdfBytes.length.toString(),
      'Content-Disposition': `inline; filename="${documentName}.pdf"`,
    },
  });
}
