import { redirect, useFetcher } from 'react-router';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/confirmation';

import { TYPES } from '~/.server/constants';
import { clearProtectedRenewState, isPrimaryApplicantStateComplete, loadProtectedRenewState, validateProtectedChildrenStateForReview } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  close: 'close',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.confirmation,
  pageTitleI18nKey: 'protected-renew:confirm.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  if (state.submissionInfo === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const selectedFederalBenefit = state.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.federalSocialProgram, locale) : undefined;
  const selectedProvincialBenefits = state.dentalBenefits?.provincialTerritorialSocialProgram
    ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.provincialTerritorialSocialProgram, locale)
    : undefined;

  const primaryApplicantInfo = isPrimaryApplicantStateComplete(state, demographicSurveyEnabled)
    ? {
        firstName: state.clientApplication.applicantInformation.firstName,
        lastName: state.clientApplication.applicantInformation.lastName,
        dentalInsurance: {
          accessToDentalInsurance: state.dentalInsurance,
          selectedFederalBenefit: selectedFederalBenefit?.name,
          selectedProvincialBenefits: selectedProvincialBenefits?.name,
        },
      }
    : undefined;

  const children = await Promise.all(
    validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled).map(async (child) => {
      if (child.isParentOrLegalGuardian === undefined || child.dentalInsurance === undefined || child.information === undefined) {
        throw new Error(`Incomplete application "${state.id}" child "${child.id}" state!`);
      }

      const federalBenefit = child.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale) : undefined;
      const provincialTerritorialSocialProgram = child.dentalBenefits?.provincialTerritorialSocialProgram
        ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
        : undefined;

      return {
        id: child.id,
        firstName: child.information.firstName,
        lastName: child.information.lastName,
        isParent: child.information.isParent,
        dentalInsurance: {
          acessToDentalInsurance: child.dentalInsurance,
          federalBenefit: {
            access: child.dentalBenefits?.hasFederalBenefits,
            benefit: federalBenefit?.name,
          },
          provTerrBenefit: {
            access: child.dentalBenefits?.hasProvincialTerritorialBenefits,
            province: child.dentalBenefits?.province,
            benefit: provincialTerritorialSocialProgram?.name,
          },
        },
      };
    }),
  );

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:confirm.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.renew.confirmation', { userId: idToken.sub });

  return {
    primaryApplicantInfo,
    children,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  clearProtectedRenewState({ params, request, session });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.renew.confirmation', { userId: idToken.sub });

  return redirect(t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI }));
}

export default function ProtectedRenewConfirm({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { primaryApplicantInfo, children } = loaderData;

  const cdcpLink = <InlineLink routeId="public/status/index" params={params} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose space-y-10">
      <section>
        <h2 className="font-lato text-3xl font-bold">{t('confirm.whats-next')}</h2>
        <p className="mt-4">{t('confirm.begin-process')}</p>
        <p className="mt-4">
          <Trans ns={handle.i18nNamespaces} i18nKey="confirm.cdcp-checker" components={{ cdcpLink, noWrap: <span className="whitespace-nowrap" /> }} />
        </p>
      </section>

      <section className="space-y-8">
        {primaryApplicantInfo && (
          <>
            <h2 className="font-lato text-3xl font-bold">{t('confirm.applicant-summary')}</h2>
            <section className="space-y-6">
              <h3 className="font-lato text-3xl font-bold">{t('confirm.applicant-title')}</h3>
              <h4 className="font-lato text-2xl font-bold">{t('confirm.member-info')}</h4>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('confirm.full-name')}>{`${primaryApplicantInfo.firstName} ${primaryApplicantInfo.lastName}`}</DescriptionListItem>
              </dl>
            </section>
            <section className="space-y-6">
              <h3 className="font-lato text-2xl font-bold">{t('confirm.dental-insurance')}</h3>
              <dl className="divide-y border-y">
                <DescriptionListItem term={t('confirm.dental-private')}> {primaryApplicantInfo.dentalInsurance.accessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-public')}>
                  {primaryApplicantInfo.dentalInsurance.selectedFederalBenefit || primaryApplicantInfo.dentalInsurance.selectedProvincialBenefits ? (
                    <>
                      <p>{t('protected-renew:confirm.yes')}</p>
                      <p>{t('protected-renew:confirm.dental-benefit-has-access')}</p>
                      <ul className="ml-6 list-disc">
                        {primaryApplicantInfo.dentalInsurance.selectedFederalBenefit && <li>{primaryApplicantInfo.dentalInsurance.selectedFederalBenefit}</li>}
                        {primaryApplicantInfo.dentalInsurance.selectedProvincialBenefits && <li>{primaryApplicantInfo.dentalInsurance.selectedProvincialBenefits}</li>}
                      </ul>
                    </>
                  ) : (
                    <p>{t('confirm.no')}</p>
                  )}
                </DescriptionListItem>
              </dl>
            </section>
          </>
        )}

        {/* CHILDREN DETAILS */}
        {children.map((child) => (
          <section className="space-y-6" key={child.id}>
            <h3 className="font-lato text-2xl font-bold">{child.firstName}</h3>
            <section>
              <h4 className="font-lato text-xl font-bold">{t('confirm.child-title', { childName: child.firstName })}</h4>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('confirm.full-name')}>{`${child.firstName} ${child.lastName}`}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-private')}>{child.dentalInsurance.acessToDentalInsurance ? t('confirm.yes') : t('confirm.no')}</DescriptionListItem>
                <DescriptionListItem term={t('confirm.dental-public')}>
                  {child.dentalInsurance.federalBenefit.benefit || child.dentalInsurance.provTerrBenefit.benefit ? (
                    <>
                      <p>{t('protected-renew:confirm.yes')}</p>
                      <p>{t('protected-renew:confirm.dental-benefit-has-access')}</p>
                      <ul className="ml-6 list-disc">
                        {child.dentalInsurance.federalBenefit.benefit && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                        {child.dentalInsurance.provTerrBenefit.benefit && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                      </ul>
                    </>
                  ) : (
                    <p>{t('confirm.no')}</p>
                  )}
                </DescriptionListItem>
                <DescriptionListItem term={t('confirm.is-parent')}>{t('confirm.yes')}</DescriptionListItem>
              </dl>
            </section>
          </section>
        ))}
      </section>

      <div className="my-6 flex flex-wrap items-center gap-3">
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <LoadingButton
            name="_action"
            value={FORM_ACTION.close}
            variant="primary"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Return to my dashboard - Your renewal for the Canadian Dental Care Plan is complete click"
          >
            {t('protected-renew:confirm.back-btn')}
          </LoadingButton>
        </fetcher.Form>
      </div>
    </div>
  );
}
