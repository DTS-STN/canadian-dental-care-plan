import { data } from 'react-router';

import { Buffer } from 'node:buffer';
import { sanitize } from 'sanitize-filename-ts';

import type { Route } from './+types/$id.download';

import { TYPES } from '~/.server/constants';
import { getLocale } from '~/.server/utils/locale.utils';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateFeatureEnabled('view-letters');
  await securityHandler.validateAuthSession({ request, session });

  if (!params.id) {
    throw data(null, { status: 400 });
  }

  const lettersOption = session.find('letters');

  // Optional TODO: add a check to see if the letter belongs to the user. (Done with LetterService call)
  if (lettersOption.isNone()) {
    throw data(null, { status: 404 });
  }

  const letter = lettersOption.unwrap().find((letter) => letter.id === params.id);

  if (!letter) {
    throw data(null, { status: 404 });
  }

  const locale = getLocale(request);
  const letterType = await appContainer.get(TYPES.LetterTypeService).getLocalizedLetterTypeById(letter.letterTypeId, locale);
  const documentName = sanitize(letterType.name);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');

  const pdfBytes = await appContainer.get(TYPES.LetterService).getPdfByLetterId({ letterId: params.id, userId: userInfoToken.sub });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('download.letter', { userId: idToken.sub });

  const decodedPdfBytes = Buffer.from(pdfBytes, 'base64');
  return new Response(decodedPdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': decodedPdfBytes.length.toString(),
      'Content-Disposition': `inline; filename="${documentName}.pdf"`,
    },
  });
}
