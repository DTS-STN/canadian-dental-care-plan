import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/your-application';

import { TYPES } from '~/.server/constants';
import { isNewOrReturningMemberSectionCompleted, isPersonalInformationSectionCompleted, isTypeOfApplicationSectionCompleted } from '~/.server/routes/helpers/protected-application-entry-section-checks';
import type { ApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getContextualAgeCategoryFromDate, getInitialApplicationFlowUrl, getProtectedApplicationState, shouldSkipNewOrReturningMember, validateProtectedApplicationContext } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { formatClientNumber } from '~/utils/application-code-utils';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const APPLICANT_TYPE = { adult: 'adult', family: 'family', children: 'children' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protectedApplication', 'gcweb'),
  pageIdentifier: pageIds.protected.application.typeOfApplication,
  pageTitleI18nKey: 'protectedApplication:yourApplication.pageTitle',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateProtectedApplicationContext(state, params, 'intake');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protectedApplication:yourApplication.pageTitle') }) };

  const applicationFlow: ApplicationFlow = state.typeOfApplication ? `${state.context}-${state.typeOfApplication}` : 'entry';
  const nextRouteId = getInitialApplicationFlowUrl(applicationFlow, params);

  const ageCategory = state.applicantInformation?.dateOfBirth ? getContextualAgeCategoryFromDate(state.applicantInformation.dateOfBirth, state.context) : undefined;
  const shouldSkipNewOrReturningMemberStep = shouldSkipNewOrReturningMember(state);
  const showNewOrReturningMemberSection = !shouldSkipNewOrReturningMemberStep;

  return {
    defaultState: {
      context: state.context,
      typeOfApplication: state.typeOfApplication,
      personalInformation: state.applicantInformation,
      livingIndependently: ageCategory === 'youth' ? state.livingIndependently : undefined,
      newOrReturningMember: state.newOrReturningMember,
    },
    nextRouteId,
    showNewOrReturningMemberSection,
    sections: {
      typeOfApplication: { completed: isTypeOfApplicationSectionCompleted(state) },
      personalInformation: { completed: isPersonalInformationSectionCompleted(state) },
      ...(shouldSkipNewOrReturningMemberStep ? {} : { newOrReturningMember: { completed: isNewOrReturningMemberSectionCompleted(state) } }),
    },
    meta,
    locale: getLocale(request),
  };
}

export default function TypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { defaultState, nextRouteId, sections, showNewOrReturningMemberSection, locale } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  function getTypeOfApplication(typeOfApplication: string) {
    switch (typeOfApplication) {
      case APPLICANT_TYPE.adult: {
        return t('protectedApplication:yourApplication.typeApplicationPersonal');
      }
      case APPLICANT_TYPE.family: {
        return t('protectedApplication:yourApplication.typeApplicationFamily');
      }
      case APPLICANT_TYPE.children: {
        return t('protectedApplication:yourApplication.typeApplicationChildren');
      }
      default: {
        return '';
      }
    }
  }

  const parsedDateOfBirth = defaultState.personalInformation ? parseDateString(defaultState.personalInformation.dateOfBirth) : undefined;
  const formattedDateOfBirth = parsedDateOfBirth ? toLocaleDateString(parsedDateOfBirth, locale) : undefined;

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-4">
        <p>{t('protectedApplication:completeAllSections')}</p>
        <p>{completedSectionsLabel}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('protectedApplication:yourApplication.typeApplicationHeading')}</CardTitle>
          <CardAction>{sections.typeOfApplication.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.typeOfApplication === undefined ? (
            <p>{t('protectedApplication:yourApplication.typeApplicationDescription')}</p>
          ) : (
            <DefinitionList layout="single-column">
              <DefinitionListItem term={t('protectedApplication:yourApplication.typeApplicationLegend')}>{getTypeOfApplication(defaultState.typeOfApplication)}</DefinitionListItem>
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink
            id="type-of-application-edit-button"
            variant="link"
            className="p-0"
            routeId="protected/application/$id/type-application"
            params={params}
            startIcon={defaultState.typeOfApplication ? faPenToSquare : faCirclePlus}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Entry:Edit type of application click"
          >
            {defaultState.typeOfApplication === undefined ? t('protectedApplication:yourApplication.addTypeApplication') : t('protectedApplication:yourApplication.editTypeApplication')}
          </ButtonLink>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('protectedApplication:yourApplication.personalInfoHeading')}</CardTitle>
          <CardAction>{sections.personalInformation.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.personalInformation === undefined ? (
            <p>{t(`protectedApplication:yourApplication.personalInfoDescription.${defaultState.context}`)}</p>
          ) : (
            <DefinitionList layout="single-column">
              {defaultState.personalInformation.memberId && <DefinitionListItem term={t('protectedApplication:yourApplication.memberId')}>{formatClientNumber(defaultState.personalInformation.memberId)}</DefinitionListItem>}
              <DefinitionListItem term={t('protectedApplication:yourApplication.fullName')}>{`${defaultState.personalInformation.firstName} ${defaultState.personalInformation.lastName}`}</DefinitionListItem>
              <DefinitionListItem term={t('protectedApplication:yourApplication.dateOfBirth')}>{formattedDateOfBirth}</DefinitionListItem>
              <DefinitionListItem term={t('protectedApplication:yourApplication.sin')}>{formatSin(defaultState.personalInformation.socialInsuranceNumber)}</DefinitionListItem>
              {defaultState.livingIndependently !== undefined && (
                <DefinitionListItem term={t('protectedApplication:yourApplication.livingIndependently')}>
                  {defaultState.livingIndependently ? t('protectedApplication:yourApplication.livingIndependentlyYes') : t('protectedApplication:yourApplication.livingIndependentlyNo')}
                </DefinitionListItem>
              )}
            </DefinitionList>
          )}
        </CardContent>
        <CardFooter className="border-t bg-zinc-100">
          <ButtonLink
            id="personal-information-edit-button"
            variant="link"
            className="p-0"
            routeId="protected/application/$id/personal-information"
            params={params}
            startIcon={defaultState.typeOfApplication ? faPenToSquare : faCirclePlus}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Entry:Edit personal information click"
          >
            {defaultState.personalInformation === undefined ? t('protectedApplication:yourApplication.addPersonalInformation') : t('protectedApplication:yourApplication.editPersonalInformation')}
          </ButtonLink>
        </CardFooter>
      </Card>

      {showNewOrReturningMemberSection && (
        <Card>
          <CardHeader>
            <CardTitle>{t('protectedApplication:yourApplication.newOrReturningHeading')}</CardTitle>
            <CardAction>{sections.newOrReturningMember?.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {defaultState.newOrReturningMember === undefined ? (
              <p>{t('protectedApplication:yourApplication.newOrReturningDescription')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('protectedApplication:yourApplication.previouslyEnrolled')}>
                  {defaultState.newOrReturningMember.isNewOrReturningMember ? t('protectedApplication:yourApplication.yes') : t('protectedApplication:yourApplication.no')}
                </DefinitionListItem>
                {defaultState.newOrReturningMember.isNewOrReturningMember === true && <DefinitionListItem term={t('protectedApplication:yourApplication.memberId')}>{defaultState.newOrReturningMember.memberId}</DefinitionListItem>}
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="protected/application/$id/new-or-returning-member" params={params} startIcon={faCirclePlus} size="lg">
              {defaultState.newOrReturningMember === undefined ? t('protectedApplication:yourApplication.addAnswer') : t('protectedApplication:yourApplication.editAnswer')}
            </ButtonLink>
          </CardFooter>
        </Card>
      )}

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" to={nextRouteId} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Entry:Continue click">
          {t('protectedApplication:yourApplication.application')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="protected/application/$id/eligibility-requirements" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Entry:Back click">
          {t('protectedApplication:yourApplication.beforeYouStart')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}
