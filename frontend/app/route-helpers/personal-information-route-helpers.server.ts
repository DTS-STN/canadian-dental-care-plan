import type { Session } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import type { PersonalInformation } from '~/schemas/personal-informaton-service-schemas.server';
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getLogger } from '~/utils/logging.server';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('personal-information-route-helpers.server');

/**
 * This function first checks the session for cached personal information.
 * If not found, it retrieves the information from the personal information service using the user's SIN provided in the user info token.
 *
 * @param userInfoToken - The user info token containing the user's SIN.
 * @param request - The incoming HTTP request object.
 * @param session - The user's session object.
 * @throws A 401 Unauthorized response if the user info token is missing the SIN.
 * @throws A redirect to the '/data-unavailable' route if the personal information is not found in the session or service
 * @returns The user's personal information
 */
async function getPersonalInformation(userInfoToken: UserinfoToken, params: Params, request: Request, session: Session) {
  if (!userInfoToken.sin) {
    log.warn('No SIN found in userInfoToken for userId [%s]', userInfoToken.sub);
    throw new Response(null, { status: 401 });
  }

  const personalInformationFromSession: PersonalInformation | undefined = session.get('personalInformation');
  if (personalInformationFromSession && !session.get('personal-info-updated')) {
    log.debug('Returning personal information that already exists in session for userId [%s]', userInfoToken.sub);
    return personalInformationFromSession;
  }

  const personalInformationService = getPersonalInformationService();
  const personalInformationFromService = await personalInformationService.getPersonalInformation(userInfoToken.sin, userInfoToken.sub);
  if (personalInformationFromService) {
    log.debug('Returning personal information from service for userId [%s] and storing it in the session', userInfoToken.sub);
    session.set('personalInformation', personalInformationFromService);
    return personalInformationFromService;
  }

  log.debug('No personal information found in session or from service for userId [%s]; Redirecting to "/data-unavailable"', userInfoToken.sub);
  throw redirect(getPathById('protected/data-unavailable', params));
}

export function getPersonalInformationRouteHelpers() {
  return {
    getPersonalInformation,
  };
}
