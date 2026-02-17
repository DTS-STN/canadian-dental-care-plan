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
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-full-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.fullAdult.maritalStatus,
  pageTitleI18nKey: 'application-full-adult:marital-status.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-adult:marital-status.page-title') }) };
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
      <ProgressStepper activeStep="marital-status" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <div className="space-y-4">
          <p>{t('application:complete-all-sections')}</p>
          <p>{completedSectionsLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('application-full-adult:marital-status.marital-status')}</CardTitle>
            <CardAction>{sections.maritalStatus.completed && <StatusTag status="complete" />}</CardAction>
          </CardHeader>
          <CardContent>
            {state.maritalStatus === undefined ? (
              <p>{t('application-full-adult:marital-status.select-your-status')}</p>
            ) : (
              <DefinitionList layout="single-column">
                <DefinitionListItem term={t('application-full-adult:marital-status.marital-status')}>{state.maritalStatus.name}</DefinitionListItem>
                {state.partnerInformation && (
                  <>
                    <DefinitionListItem term={t('application-full-adult:marital-status.spouse-sin')}>{formatSin(state.partnerInformation.socialInsuranceNumber)}</DefinitionListItem>
                    <DefinitionListItem term={t('application-full-adult:marital-status.spouse-yob')}>{state.partnerInformation.yearOfBirth}</DefinitionListItem>
                    <DefinitionListItem term={t('application-full-adult:marital-status.consent')}>
                      {state.partnerInformation.confirm ? t('application-full-adult:marital-status.consent-yes') : t('application-full-adult:marital-status.consent-no')}
                    </DefinitionListItem>
                  </>
                )}
              </DefinitionList>
            )}
          </CardContent>
          <CardFooter className="border-t bg-zinc-100">
            <ButtonLink id="edit-button" variant="link" className="p-0" routeId="public/application/$id/marital-status" params={params} startIcon={sections.maritalStatus.completed ? faPenToSquare : faCirclePlus} size="lg">
              {state.maritalStatus === undefined ? t('application-full-adult:marital-status.add-marital-status') : t('application-full-adult:marital-status.edit-marital-status')}
            </ButtonLink>
          </CardFooter>
        </Card>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <NavigationButtonLink disabled={!allSectionsCompleted} variant="primary" direction="next" routeId="public/application/$id/full-adult/contact-information" params={params}>
            {t('application-full-adult:marital-status.contact-information')}
          </NavigationButtonLink>
          <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/type-of-application" params={params}>
            {t('application-full-adult:marital-status.type-of-application')}
          </NavigationButtonLink>
        </div>
      </div>
    </>
  );
}
