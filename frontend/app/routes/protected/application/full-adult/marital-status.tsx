import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationFullAdultState } from '~/.server/routes/helpers/protected-application-full-adult-route-helpers';
import { isMaritalStatusSectionCompleted } from '~/.server/routes/helpers/protected-application-full-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/full-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-full-adult', 'gcweb'),
  pageIdentifier: pageIds.protected.application.fullAdult.maritalStatus,
  pageTitleI18nKey: 'protected-application-full-adult:marital-status.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationFullAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-full-adult:marital-status.page-title') }) };
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

export default function ProtectedNewAdultMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { state, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <>
      <ProgressStepper activeStep="marital-status" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('protected-application:required-label')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('protected-application-full-adult:marital-status.marital-status')}</CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t('protected-application-full-adult:marital-status.select-your-status')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protected-application-full-adult:marital-status.marital-status')}>{state.maritalStatus.name}</DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t('protected-application-full-adult:marital-status.spouse-sin')}>{formatSin(state.partnerInformation.socialInsuranceNumber)}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-full-adult:marital-status.spouse-yob')}>{state.partnerInformation.yearOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t('protected-application-full-adult:marital-status.consent')}>
                      {state.partnerInformation.confirm ? t('protected-application-full-adult:marital-status.consent-yes') : t('protected-application-full-adult:marital-status.consent-no')}
                    </DefinitionListItem>
                  </>
                )}
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="protected/application/$id/marital-status" params={params} startIcon={sections.maritalStatus.completed ? faPenToSquare : faCirclePlus} size="lg">
              {state.maritalStatus === undefined ? t('protected-application-full-adult:marital-status.add-marital-status') : t('protected-application-full-adult:marital-status.edit-marital-status')}
            </ButtonLink>
          </CardFooter>
        </Card>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="protected/application/$id/full-adult/contact-information" params={params}>
            {t('protected-application-full-adult:marital-status.next-btn')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/type-of-application" params={params}>
            {t('protected-application-full-adult:marital-status.prev-btn')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}
