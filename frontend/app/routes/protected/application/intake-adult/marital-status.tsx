import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/marital-status';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationIntakeAdultState } from '~/.server/routes/helpers/protected-application-intake-adult-route-helpers';
import { isMaritalStatusSectionCompleted } from '~/.server/routes/helpers/protected-application-intake-section-checks';
import { validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/protected/application/intake-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protectedApplication', 'protectedApplicationIntakeAdult', 'gcweb'),
  pageIdentifier: pageIds.protected.application.intakeAdult.maritalStatus,
  pageTitleI18nKey: 'protectedApplicationIntakeAdult:maritalStatus.pageHeading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['intake-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = {
    title: t(($) => $.meta.title.template, { ns: 'gcweb', title: t(($) => $.maritalStatus.pageTitle, { ns: 'protectedApplicationIntakeAdult' }) }),
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
              <h2>{t(($) => $.maritalStatus.maritalStatus, { ns: 'protectedApplicationIntakeAdult' })}</h2>
            </CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t(($) => $.maritalStatus.selectYourStatus, { ns: 'protectedApplicationIntakeAdult' })}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t(($) => $.maritalStatus.maritalStatus, { ns: 'protectedApplicationIntakeAdult' })}>{state.maritalStatus.name}</DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t(($) => $.maritalStatus.spouseSin, { ns: 'protectedApplicationIntakeAdult' })}>{formatSin(state.partnerInformation.socialInsuranceNumber)}</DefinitionListItem>
                    <DefinitionListItem term={t(($) => $.maritalStatus.spouseYob, { ns: 'protectedApplicationIntakeAdult' })}>{state.partnerInformation.yearOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t(($) => $.maritalStatus.consent, { ns: 'protectedApplicationIntakeAdult' })}>{t(($) => $.maritalStatus.consentYes, { ns: 'protectedApplicationIntakeAdult' })}</DefinitionListItem>
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
              routeId="protected/application/$id/marital-status"
              params={params}
              startIcon={sections.maritalStatus.completed ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Edit marital click"
            >
              {state.maritalStatus === undefined ? t(($) => $.maritalStatus.addMaritalStatus, { ns: 'protectedApplicationIntakeAdult' }) : t(($) => $.maritalStatus.editMaritalStatus, { ns: 'protectedApplicationIntakeAdult' })}
            </ButtonLink>
          </CardFooter>
        </Card>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink
            disabled={!allSectionsCompleted}
            variant="primary"
            direction="next"
            routeId="protected/application/$id/intake-adult/contact-information"
            params={params}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Continue click"
          >
            {t(($) => $.maritalStatus.nextBtn, { ns: 'protectedApplicationIntakeAdult' })}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/your-application" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Adult:Back click">
            {t(($) => $.maritalStatus.prevBtn, { ns: 'protectedApplicationIntakeAdult' })}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}
