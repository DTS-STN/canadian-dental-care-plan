import { useTranslation } from 'react-i18next';

import type { Route } from './+types/communication-preferences';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protectedProfile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.communicationPreferences,
  pageTitleI18nKey: 'protectedProfile:communicationPreferences.pageTitle',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const locale = getLocale(request);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.mscaTemplate', { title: t('protectedProfile:communicationPreferences.pageTitle') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = appContainer.get(TYPES.ServerConfig);

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.communication-preferences', { userId: idToken.sub });

  return {
    meta,
    preferredLanguage: clientApplication.communicationPreferences.preferredLanguage //
      ? appContainer.get(TYPES.LanguageService).getLocalizedLanguageById(clientApplication.communicationPreferences.preferredLanguage, locale)
      : undefined,
    preferredMethodSunLife: clientApplication.communicationPreferences.preferredMethodSunLife
      ? appContainer.get(TYPES.SunLifeCommunicationMethodService).getLocalizedSunLifeCommunicationMethodById(clientApplication.communicationPreferences.preferredMethodSunLife, locale)
      : undefined,
    preferredMethodGovernmentOfCanada: clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada
      ? appContainer.get(TYPES.GCCommunicationMethodService).getLocalizedGCCommunicationMethodById(clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada, locale)
      : undefined,
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
      <DefinitionList border>
        <DefinitionListItem term={t('protectedProfile:communicationPreferences.languagePreference')}>{preferredLanguage?.name}</DefinitionListItem>
        <DefinitionListItem term={t('protectedProfile:communicationPreferences.sunlifeCommunicationPreference')}>{preferredMethodSunLife?.name}</DefinitionListItem>
        <DefinitionListItem term={t('protectedProfile:communicationPreferences.gocCommunicationPreference')}>{preferredMethodGovernmentOfCanada?.name}</DefinitionListItem>
      </DefinitionList>
      <div>
        <InlineLink id="update-communication-preferences" routeId="protected/profile/communication-preferences/edit" params={params}>
          {t('protectedProfile:communicationPreferences.updateLinkText')}
        </InlineLink>
      </div>
      <ButtonLink
        variant="primary"
        id="back-button"
        to={t('gcweb:header.menuDashboardHref', { baseUri: SCCH_BASE_URI })}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Return to dashboard - My communication preferences return button click"
      >
        {t('protectedProfile:communicationPreferences.returnButton')}
      </ButtonLink>
    </div>
  );
}
