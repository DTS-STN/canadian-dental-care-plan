import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullAdultState } from '~/.server/routes/helpers/public-application-full-adult-route-helpers';
import { isMaritalStatusSectionCompleted } from '~/.server/routes/helpers/public-application-full-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/full-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'applicationFullAdult', 'gcweb'),
  pageIdentifier: pageIds.public.application.fullAdult.maritalStatus,
  pageTitleI18nKey: 'applicationFullAdult:maritalStatus.pageHeading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = {
    title: t(($) => $.meta.title.template, { ns: 'gcweb', title: t(($) => $.maritalStatus.pageTitle, { ns: 'applicationFullAdult' }) }),
  };
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

export default function NewAdultMaritalStatus({ loaderData, params }: Route.ComponentProps) {
  const { state, sections } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <>
      <ProgressStepper activeStep="maritalStatus" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t(($) => $.completeAllSections)}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{t(($) => $.maritalStatus.maritalStatus, { ns: 'applicationFullAdult' })}</h2>
            </CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t(($) => $.maritalStatus.selectYourStatus, { ns: 'applicationFullAdult' })}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.maritalStatus.maritalStatus, { ns: 'applicationFullAdult' })}>{state.maritalStatus.name}</DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t(($) => $.maritalStatus.spouseSin, { ns: 'applicationFullAdult' })}>{formatSin(state.partnerInformation.socialInsuranceNumber)}</DefinitionListItem>
                    <DefinitionListItem term={t(($) => $.maritalStatus.spouseYob, { ns: 'applicationFullAdult' })}>{state.partnerInformation.yearOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t(($) => $.maritalStatus.consent, { ns: 'applicationFullAdult' })}>{t(($) => $.maritalStatus.consentYes, { ns: 'applicationFullAdult' })}</DefinitionListItem>
                  </>
                )}
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="edit-marital-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/marital-status"
              params={params}
              startIcon={sections.maritalStatus.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Adult:Edit marital click"
            >
              {state.maritalStatus === undefined ? t(($) => $.maritalStatus.addMaritalStatus, { ns: 'applicationFullAdult' }) : t(($) => $.maritalStatus.editMaritalStatus, { ns: 'applicationFullAdult' })}
            </ButtonLink>
          </CardFooter>
        </Card>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="public/application/$id/full-adult/contact-information"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Adult:Continue click"
          >
            {t(($) => $.maritalStatus.contactInformation, { ns: 'applicationFullAdult' })}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/your-application" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Adult:Back click">
            {t(($) => $.maritalStatus.yourApplication, { ns: 'applicationFullAdult' })}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}
