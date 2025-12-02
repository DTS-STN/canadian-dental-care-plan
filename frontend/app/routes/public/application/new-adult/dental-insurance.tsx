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
    defaultState: {
      dentalInsurance: state.dentalInsurance,
      dentalBenefits: state.dentalBenefits,
    },
    meta,
  };
}

export default function NewAdultDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { defaultState } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

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
      <p>{t('application:required-label')}</p>
      <p>{t('application:sections-completed', { number: (defaultState.dentalInsurance === undefined ? 0 : 1) + (defaultState.dentalBenefits === undefined ? 0 : 1) })}</p>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:dental-insurance.access-to-dental-insurance')}</ApplicantCardTitle>
          {defaultState.dentalInsurance !== undefined && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.dentalInsurance === undefined ? (
            <p>{t('application-new-adult:dental-insurance.dental-insurance-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:dental-insurance.access-to-dental-insurance-or-coverage')}>
                <p>{defaultState.dentalInsurance ? t('application-new-adult:dental-insurance.dental-insurance-yes') : t('application-new-adult:dental-insurance.dental-insurance-no')}</p>
              </DescriptionListItem>
            </dl>
          )}
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <ButtonLink id="edit-button" variant="link" routeId="public/application/$id/dental-insurance" params={params} startIcon={faCirclePlus} size="lg">
            {defaultState.dentalInsurance === undefined ? t('application-new-adult:dental-insurance.add-answer') : t('application-new-adult:dental-insurance.edit-access-to-dental-insurance')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>{t('application-new-adult:dental-insurance.other-benefits')}</ApplicantCardTitle>
          {defaultState.dentalBenefits && <StatusTag status="complete" />}
        </ApplicantCardHeader>
        <ApplicantCardBody>
          {defaultState.dentalBenefits === undefined ? (
            <p>{t('application-new-adult:dental-insurance.dental-benefits-indicate-status')}</p>
          ) : (
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('application-new-adult:dental-insurance.access-to-government-benefits')}>
                <p>{t('application-new-adult:dental-insurance.dental-insurance-yes')}</p>
                {defaultState.dentalBenefits.hasFederalBenefits || defaultState.dentalBenefits.hasProvincialTerritorialBenefits ? (
                  <>
                    <p>{t('application-new-adult:dental-insurance.yes')}</p>
                    <ul className="ml-6 list-disc">
                      {defaultState.dentalBenefits.hasFederalBenefits && <li>{defaultState.dentalBenefits.federalSocialProgram}</li>}
                      {defaultState.dentalBenefits.hasProvincialTerritorialBenefits && <li>{defaultState.dentalBenefits.provincialTerritorialSocialProgram}</li>}
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
            {defaultState.dentalBenefits === undefined ? t('application-new-adult:dental-insurance.add-answer') : t('application-new-adult:dental-insurance.edit-access-to-government-benefits')}
          </ButtonLink>
        </ApplicantCardFooter>
      </ApplicantCard>

      <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        {/* TODO: update routeIds */}
        <NavigationButtonLink variant="secondary" direction="next" routeId="public/application/$id/new-adult/marital-status" params={params}>
          {t('application-new-adult:dental-insurance.submit')}
        </NavigationButtonLink>
        <NavigationButtonLink variant="primary" direction="previous" routeId="public/application/$id/new-adult/marital-status" params={params}>
          {t('application-new-adult:dental-insurance.contact-information')}
        </NavigationButtonLink>
      </div>
    </div>
  );
}
