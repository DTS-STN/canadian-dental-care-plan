import { useTranslation } from 'react-i18next';

import type { Route } from './+types/communication-preferences';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.communicationPreferences,
  pageTitleI18nKey: 'protected-profile:communication-preferences.page-title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const locale = getLocale(request);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:communication-preferences.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.communication-preferences', { userId: idToken.sub });

  return {
    meta,
    preferredLanguage: appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(clientApplication.communicationPreferences.preferredLanguage, locale),
    preferredMethodSunLife: appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(clientApplication.communicationPreferences.preferredMethodSunLife, locale),
    preferredMethodGovernmentOfCanada: appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada, locale),
    SCCH_BASE_URI,
    COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID,
    COMMUNICATION_METHOD_GC_DIGITAL_ID,
  };
}

export default function ViewCommunicationPreferences({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { preferredLanguage, preferredMethodSunLife, preferredMethodGovernmentOfCanada, SCCH_BASE_URI } = loaderData;

  return (
    <div className="max-w-prose space-y-10">
      <dl className="divide-y border-y">
        <DescriptionListItem term={t('protected-profile:communication-preferences.language-preference')}>
          <p>{preferredLanguage.name}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:communication-preferences.sunlife-communication-preference')}>
          <p>{preferredMethodSunLife.name}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected-profile:communication-preferences.goc-communication-preference')}>
          <p>{preferredMethodGovernmentOfCanada.name}</p>
        </DescriptionListItem>
      </dl>
      <div>
        <InlineLink id="update-communication-preferences" routeId="protected/profile/communication-preferences/edit" params={params}>
          {t('protected-profile:communication-preferences.update-link-text')}
        </InlineLink>
      </div>
      <ButtonLink
        variant="primary"
        id="back-button"
        to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Return to dashboard - My communication preferences return button click"
      >
        {t('protected-profile:communication-preferences.return-button')}
      </ButtonLink>
    </div>
  );
}
