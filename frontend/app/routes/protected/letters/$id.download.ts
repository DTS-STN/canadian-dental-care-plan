import { data } from 'react-router';

import { Buffer } from 'node:buffer';
import { sanitize } from 'sanitize-filename-ts';

import type { Route } from './+types/$id.download';

import { TYPES } from '~/.server/constants';
import type { LetterDto } from '~/.server/domain/dtos';
import { getLocale } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateFeatureEnabled('view-letters');
  await securityHandler.validateAuthSession({ request, session });

  if (!params.id) {
    throw data(null, { status: 400 });
  }

  // Check if the letters are in the session
  const letters: ReadonlyArray<LetterDto> | undefined = session.find('letters');
  // Optional TODO: add a check to see if the letter belongs to the user. (Done with LetterService call)
  if (!letters) {
    throw data(null, { status: 404 });
  }

  const letter = letters.find((letter) => letter.id === params.id);

  if (!letter) {
    throw data(null, { status: 404 });
  }

  const locale = getLocale(request);
  const letterType = appContainer.get(TYPES.domain.services.LetterTypeService).getLocalizedLetterTypeById(letter.letterTypeId, locale);
  const documentName = sanitize(letterType.name);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  const pdfBytes = await appContainer.get(TYPES.domain.services.LetterService).getPdfByLetterId({ letterId: params.id, userId: userInfoToken.sub });

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
