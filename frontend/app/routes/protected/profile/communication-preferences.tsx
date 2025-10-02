import { redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/communication-preferences';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const PREFERRED_SUN_LIFE_METHOD = { email: 'email', mail: 'mail' } as const;
export const PREFERRED_NOTIFICATION_METHOD = { msca: 'msca', mail: 'mail' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.communicationPreferences,
  pageTitleI18nKey: 'protected-profile:communication-preferences.page-title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const userInfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.ApplicationYearService);
  const applicationYear = applicationYearService.getRenewalApplicationYear(currentDate);

  const clientApplicationService = appContainer.get(TYPES.ClientApplicationService);
  const clientApplicationResult = await clientApplicationService.findClientApplicationBySin({ sin: userInfoToken.sin, applicationYearId: applicationYear.applicationYearId, userId: userInfoToken.sub });

  if (clientApplicationResult.isNone()) {
    throw redirect(getPathById('protected/data-unavailable', params));
  }

  const clientApplication = clientApplicationResult.unwrap();

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:communication-preferences.page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  return {
    meta,
    preferredLanguage: appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(clientApplication.communicationPreferences.preferredLanguage, locale),
    sunlifeComminicationPreference: clientApplication.communicationPreferences.preferredMethod,
    gocComminicationPreference: clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada,
    SCCH_BASE_URI,
  };
}

export default function ViewCommunicationPreferences({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { preferredLanguage, sunlifeComminicationPreference, gocComminicationPreference, SCCH_BASE_URI } = loaderData;

  return (
    <div className="max-w-prose">
      <dl>
        <DescriptionListItem term={t('protected-profile:communication-preferences.language-preference')}>
          <p>{preferredLanguage.name}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:communication-preferences.sunlife-communication-preference')}>
          <p>{sunlifeComminicationPreference === PREFERRED_SUN_LIFE_METHOD.email ? t('protected-profile:communication-preferences.by-email') : t('protected-profile:communication-preferences.by-mail')}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:communication-preferences.goc-communication-preference')}>
          <p>{gocComminicationPreference === PREFERRED_NOTIFICATION_METHOD.msca ? t('protected-profile:communication-preferences.online') : t('protected-profile:communication-preferences.by-mail')}</p>
        </DescriptionListItem>
      </dl>
      <InlineLink id="update-communication-preferences" routeId="protected/profile/communication-preferences/edit" params={params}>
        {t('protected-profile:communication-preferences.update-link-text')}
      </InlineLink>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink variant="primary" id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>
          {t('protected-profile:communication-preferences.return-button')}
        </ButtonLink>
      </div>
    </div>
  );
}
