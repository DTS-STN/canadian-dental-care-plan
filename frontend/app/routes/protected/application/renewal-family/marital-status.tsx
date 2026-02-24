import { redirect } from 'react-router';

import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationRenewalFamilyState } from '~/.server/routes/helpers/protected-application-renewal-family-route-helpers';
import { isMaritalStatusSectionCompleted } from '~/.server/routes/helpers/protected-application-renewal-section-checks';
import { shouldSkipMaritalStatus, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/renewal-family/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-renewal-family', 'gcweb'),
  pageIdentifier: pageIds.protected.application.renewalFamily.maritalStatus,
  pageTitleI18nKey: 'protected-application-renewal-family:marital-status.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalFamilyState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-family']);

  if (shouldSkipMaritalStatus(state)) {
    throw redirect(getPathById('protected/application/$id/renewal-family/contact-information', params));
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-renewal-family:marital-status.page-title') }) };
  const locale = getLocale(request);
  return {
    state: {
      maritalStatus: state.maritalStatus ? appContainer.get(TYPES.MaritalStatusService).getLocalizedMaritalStatusById(state.maritalStatus, locale) : undefined,
      partnerInformation: state.partnerInformation,
    },
    sections: {
      maritalStatus: { completed: isMaritalStatusSectionCompleted(state) },
    },
    meta,
  };
}

export default function ProtectedNewFamilyMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { state, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <>
      <ProgressStepper activeStep="marital-status" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-renewal-family:marital-status.marital-status')}</CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t('protected-application-renewal-family:marital-status.select-your-status')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-renewal-family:marital-status.marital-status')}>{state.maritalStatus.name}</DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t('protected-application-renewal-family:marital-status.spouse-sin')}>{formatSin(state.partnerInformation.socialInsuranceNumber)}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-renewal-family:marital-status.spouse-yob')}>{state.partnerInformation.yearOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-renewal-family:marital-status.consent')}>
                      {state.partnerInformation.confirm ? t('protected-application-renewal-family:marital-status.consent-yes') : t('protected-application-renewal-family:marital-status.consent-no')}
                    </DefinitionListItem>
                  </>
                )}
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-marital-status-button"
              variant="link"
              className="p-0"
              routeId="protected/application/$id/marital-status"
              params={params}
              startIcon={sections.maritalStatus.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Edit marital status click"
            >
              {state.maritalStatus === undefined ? t('protected-application-renewal-family:marital-status.add-marital-status') : t('protected-application-renewal-family:marital-status.edit-marital-status')}
            </ButtonLink>
          </CardFooter>
        </Card>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="protected/application/$id/renewal-family/contact-information"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Continue click"
          >
            {t('protected-application-renewal-family:marital-status.next-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/renew" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Family: Back click">
            {t('protected-application-renewal-family:marital-status.prev-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}
