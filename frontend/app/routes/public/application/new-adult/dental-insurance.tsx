import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-insurance';

import { getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ApplicantCard, ApplicantCardBody, ApplicantCardFooter, ApplicantCardHeader, ApplicantCardTitle } from '~/components/applicant-card';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { ProgressStepper } from '~/components/progress-stepper';
import { StatusTag } from '~/components/status-tag';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-new-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.newAdult.dentalInsurance,
  pageTitleI18nKey: 'application-new-adult:dental-insurance.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-new-adult:dental-insurance.page-title') }) };
  return {
    state: {
      dentalInsurance: state.dentalInsurance,
      dentalBenefits: state.dentalBenefits,
    },
    meta,
  };
}

export default function NewAdultDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { state } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const sections = [
    { id: 'dental-insurance', completed: state.dentalInsurance !== undefined }, //
    { id: 'dental-benefits', completed: state.dentalBenefits !== undefined },
  ] as const;
  const completedSections = sections.filter((section) => section.completed).length;
  const allSectionsCompleted = completedSections === sections.length;

  return (
    <div className="max-w-prose space-y-8">
      <ProgressStepper
        steps={[
          { id: 'marital-status', status: 'inactive', description: t('application:progress-stepper.marital-status') },
          { id: 'contact-information', status: 'inactive', description: t('application:progress-stepper.contact-information') },
          { id: 'dental-insurance', status: 'active', description: t('application:progress-stepper.dental-insurance') },
          { id: 'submit', status: 'inactive', description: t('application:progress-stepper.submit') },
        ]}
        currentStep={2}
      />

      <div className="space-y-4">
        <p>{t('application:required-label')}</p>
        <p>{t('application:sections-completed', { number: completedSections, count: sections.length })}</p>
      </div>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:dental-insurance.access-to-dental-insurance')}</ApplicantCardTitle>
          {sections.some((section) => section.id === 'dental-insurance' && section.completed) && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {state.dentalInsurance === undefined ? (
            <p>{t('application-new-adult:dental-insurance.dental-insurance-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:dental-insurance.access-to-dental-insurance-or-coverage')}>
                <p>{state.dentalInsurance ? t('application-new-adult:dental-insurance.dental-insurance-yes') : t('application-new-adult:dental-insurance.dental-insurance-no')}</p>
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/dental-insurance" params={params} startIcon={faCirclePlus} size="lg">
            {state.dentalInsurance === undefined ? t('application-new-adult:dental-insurance.add-answer') : t('application-new-adult:dental-insurance.edit-access-to-dental-insurance')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:dental-insurance.other-benefits')}</ApplicantCardTitle>
          {sections.some((section) => section.id === 'dental-benefits' && section.completed) && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {state.dentalBenefits === undefined ? (
            <p>{t('application-new-adult:dental-insurance.dental-benefits-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:dental-insurance.access-to-government-benefits')}>
                <p>{t('application-new-adult:dental-insurance.dental-insurance-yes')}</p>
                {state.dentalBenefits.hasFederalBenefits || state.dentalBenefits.hasProvincialTerritorialBenefits ? (
                  <>
                    <p>{t('application-new-adult:dental-insurance.yes')}</p>
                    <ul className="ml-6 list-disc">
                      {state.dentalBenefits.hasFederalBenefits && <li>{state.dentalBenefits.federalSocialProgram}</li>}
                      {state.dentalBenefits.hasProvincialTerritorialBenefits && <li>{state.dentalBenefits.provincialTerritorialSocialProgram}</li>}
                    </ul>
                  </>
                ) : (
                  <p>{t('application-new-adult:dental-insurance.no')}</p>
                )}
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          {/* TODO: update routeIds */}
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/new-adult/marital-status" params={params} startIcon={faCirclePlus} size="lg">
            {state.dentalBenefits === undefined ? t('application-new-adult:dental-insurance.add-answer') : t('application-new-adult:dental-insurance.edit-access-to-government-benefits')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        {/* TODO: update routeIds */}
        <NavigationButtonLink disabled={!allSectionsCompleted} variant="secondary" direction="next" routeId="public/application/$id/new-adult/marital-status" params={params}>
          {t('application-new-adult:dental-insurance.submit')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="primary" direction="previous" routeId="public/application/$id/new-adult/marital-status" params={params}>
          {t('application-new-adult:dental-insurance.contact-information')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}
