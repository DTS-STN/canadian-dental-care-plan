import { faCirclePlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/your-application';

import { getTypeOfApplicationSectionCompletionResult, isNewOrReturningMemberSectionCompleted, isPersonalInformationSectionCompleted } from '~/.server/routes/helpers/public-application-entry-section-checks';
import type { ApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getContextualAgeCategoryFromDate, getInitialApplicationFlowUrl, getPublicApplicationState, shouldSkipNewOrReturningMember } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/card';
import { ContextualAlert } from '~/components/contextual-alert';
import { DefinitionList, DefinitionListItem } from '~/components/definition-list';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { StatusTag } from '~/components/status-tag';
import { useSectionsStatus } from '~/hooks';
import { pageIds } from '~/page-ids';
import { formatClientNumber } from '~/utils/application-code-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';
import { cn } from '~/utils/tw-utils';

const APPLICANT_TYPE = { adult: 'adult', family: 'family', children: 'children' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'gcweb'),
  pageIdentifier: pageIds.public.application.typeOfApplication,
  pageTitleI18nKey: 'application:your-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application:your-application.page-title') }) };

  const applicationFlow: ApplicationFlow = state.inputModel && state.typeOfApplication ? `${state.inputModel}-${state.typeOfApplication}` : 'entry';
  const nextRouteId = getInitialApplicationFlowUrl(applicationFlow, params);
  const typeOfApplicationSectionCompletionResult = getTypeOfApplicationSectionCompletionResult(state);

  const ageCategory = state.applicantInformation?.dateOfBirth ? getContextualAgeCategoryFromDate(state.applicantInformation.dateOfBirth, state.context) : undefined;
  const shouldSkipNewOrReturningMemberStep = shouldSkipNewOrReturningMember(state);
  const showNewOrReturningMemberSection = !shouldSkipNewOrReturningMemberStep;

  return {
    defaultState: {
      context: state.context,
      inputModel: state.inputModel,
      typeOfApplication: state.typeOfApplication,
      personalInformation: state.applicantInformation,
      livingIndependently: ageCategory === 'youth' ? state.livingIndependently : undefined,
      newOrReturningMember: state.newOrReturningMember,
    },
    isRenewalContext: state.context === 'renewal',
    nextRouteId,
    showNewOrReturningMemberSection,
    typeOfApplicationSectionCompletionResult,
    sections: {
      typeOfApplication: { completed: typeOfApplicationSectionCompletionResult === 'COMPLETED' },
      personalInformation: { completed: isPersonalInformationSectionCompleted(state) },
      ...(shouldSkipNewOrReturningMemberStep ? {} : { newOrReturningMember: { completed: isNewOrReturningMemberSectionCompleted(state) } }),
    },
    meta,
  };
}

export default function TypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { defaultState, isRenewalContext, nextRouteId, sections, showNewOrReturningMemberSection, typeOfApplicationSectionCompletionResult } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  function getTypeOfApplication(typeOfApplication: string) {
    switch (typeOfApplication) {
      case APPLICANT_TYPE.adult: {
        return t('application:your-application.type-application-personal');
      }
      case APPLICANT_TYPE.family: {
        return t('application:your-application.type-application-family');
      }
      case APPLICANT_TYPE.children: {
        return t('application:your-application.type-application-children');
      }
      default: {
        return '';
      }
    }
  }

  const formattedDate = defaultState.personalInformation ? format(parseISO(defaultState.personalInformation.dateOfBirth), 'MMMM d, yyyy') : undefined;

  const { completedSectionsLabel, allSectionsCompleted } = useSectionsStatus(sections);
  const isTypeOfApplicationTypeMismatched = typeOfApplicationSectionCompletionResult === 'TYPE-MISMATCHED';

  return (
    <div className="max-w-prose space-y-8">
      <div className="space-y-4">
        <p>{t('application:complete-all-sections')}</p>
        <p>{completedSectionsLabel}</p>
      </div>
      <Card className={cn(isTypeOfApplicationTypeMismatched && 'border-red-600')}>
        <CardHeader>
          <CardTitle asChild>
            <h2>{t('application:your-application.type-application-heading')}</h2>
          </CardTitle>
          <CardAction>
            {isTypeOfApplicationTypeMismatched && <StatusTag status="error" />}
            {sections.typeOfApplication.completed && <StatusTag status="complete" />}
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          {defaultState.typeOfApplication === undefined ? (
            <p>{t('application:your-application.type-application-description')}</p>
          ) : (
            <DefinitionList layout="single-column">
              <DefinitionListItem term={t('application:your-application.type-application-legend')}>{getTypeOfApplication(defaultState.typeOfApplication)}</DefinitionListItem>
            </DefinitionList>
          )}
          {isTypeOfApplicationTypeMismatched && (
            <ContextualAlert type="danger" role="region" aria-live="polite">
              <p>{t('application:your-application.type-application-mismatch')}</p>
            </ContextualAlert>
          )}
        </CardContent>
        <CardFooter className={cn('border-t bg-zinc-100', isTypeOfApplicationTypeMismatched && 'bg-red-100')}>
          <ButtonLink
            id="type-of-application-edit-button"
            variant="link"
            className={cn('p-0', isTypeOfApplicationTypeMismatched && 'text-red-700 hover:text-red-800 focus:text-red-800')}
            routeId="public/application/$id/type-application"
            params={params}
            startIcon={defaultState.typeOfApplication ? faPenToSquare : faCirclePlus}
            size="lg"
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Entry:Edit type of application click"
          >
            {defaultState.typeOfApplication === undefined ? t('application:your-application.add-type-application') : t('application:your-application.edit-type-application')}
          </ButtonLink>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2>{t('application:your-application.personal-info-heading')}</h2>
          </CardTitle>
          <CardAction>{sections.personalInformation.completed && <StatusTag status="complete" />}</CardAction>
        </CardHeader>
        <CardContent>
          {defaultState.personalInformation === undefined ? (
            <p>{t(`application:your-application.personal-info-description.${defaultState.context}`)}</p>
          ) : (
            <DefinitionList layout="single-column">
              {defaultState.personalInformation.memberId && <DefinitionListItem term={t('application:your-application.member-id')}>{formatClientNumber(defaultState.personalInformation.memberId)}</DefinitionListItem>}
              <DefinitionListItem term={t('application:your-application.full-name')}>{`${defaultState.personalInformation.firstName} ${defaultState.personalInformation.lastName}`}</DefinitionListItem>
              <DefinitionListItem term={t('application:your-application.date-of-birth')}>{formattedDate}</DefinitionListItem>
              <DefinitionListItem term={t('application:your-application.sin')}>{formatSin(defaultState.personalInformation.socialInsuranceNumber)}</DefinitionListItem>
              {defaultState.livingIndependently !== undefined && (
                <DefinitionListItem term={t('application:your-application.living-independently')}>
                  {defaultState.livingIndependently ? t('application:your-application.living-independently-yes') : t('application:your-application.living-independently-no')}
                </DefinitionListItem>
              )}
            </DefinitionList>
          )}
        </CardContent>
        {isRenewalContext && !sections.personalInformation.completed && (
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="personal-information-edit-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/personal-information"
              params={params}
              startIcon={faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Entry:Edit personal information click"
            >
              {t('application:your-application.add-personal-information')}
            </ButtonLink>
          </CardFooter>
        )}
        {!isRenewalContext && (
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink
              id="personal-information-edit-button"
              variant="link"
              className="p-0"
              routeId="public/application/$id/personal-information"
              params={params}
              startIcon={defaultState.typeOfApplication ? faPenToSquare : faCirclePlus}
              size="lg"
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Entry:Edit personal information click"
            >
              {defaultState.personalInformation === undefined ? t('application:your-application.add-personal-information') : t('application:your-application.edit-personal-information')}
            </ButtonLink>
          </CardFooter>
        )}
      </Card>

      {showNewOrReturningMemberSection && (
        <Card>
          <CardHeader>
            <CardTitle>{t('application:your-application.new-or-returning-heading')}</CardTitle>
            <CardAction>{sections.newOrReturningMember?.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {defaultState.newOrReturningMember?.isNewOrReturningMember === undefined ? (
              <p>{t('application:your-application.new-or-returning-description')}</p>
            ) : (
              <>
                {defaultState.newOrReturningMember.isNewOrReturningMember === false ? (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('application:your-application.previously-enrolled')}>
                      <p>{t('application:your-application.non')}</p>
                    </DefinitionListItem>
                  </DefinitionList>
                ) : (
                  <DefinitionList layout="single-column">
                    <DefinitionListItem term={t('application:your-application.previously-enrolled')}>
                      <p>{t('application:your-application.yes')}</p>
                      <ul className="list-disc">
                        <li className="ml-8">{defaultState.newOrReturningMember.memberId}</li>
                      </ul>
                    </DefinitionListItem>
                    <DefinitionListItem term={t('application:your-application.full-name')}>{`${defaultState.personalInformation?.firstName} ${defaultState.personalInformation?.lastName}`}</DefinitionListItem>
                    <DefinitionListItem term={t('application:your-application.date-of-birth')}>{formattedDate}</DefinitionListItem>
                  </DefinitionList>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/new-or-returning-member" params={params} startIcon={faCirclePlus} size="lg">
              {defaultState.newOrReturningMember === undefined ? t('application:your-application.add-answer') : t('application:your-application.edit-answer')}
            </ButtonLink>
          </CardFooter>
        </Card>
      )}

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" to={nextRouteId} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Entry:Continue click">
          {t('application:your-application.application')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/eligibility-requirements" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Entry:Back click">
          {t('application:your-application.before-you-start')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}
