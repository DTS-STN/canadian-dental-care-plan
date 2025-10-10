import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/review-child-information';

import { TYPES } from '~/.server/constants';
import { clearProtectedRenewState, isPrimaryApplicantStateComplete, loadProtectedRenewState, saveProtectedRenewState, validateProtectedChildrenStateForReview } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useFeature } from '~/root';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  back: 'back',
  submit: 'submit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.reviewChildInformation,
  pageTitleI18nKey: 'protected-renew:review-child-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');
  const validatedChildren = validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled);

  // renew state is valid then edit mode can be set to true
  saveProtectedRenewState({
    params,
    request,
    session,
    state: { editMode: true },
  });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-renew:review-child-information.page-title') }) };

  // we need to work with a copy of the state because a user could back navigate renew for another child and mutable data would have possibly filtered that child from state
  const copiedState = JSON.parse(JSON.stringify(state));
  copiedState.children = validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled);

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const children = await Promise.all(
    validatedChildren.map(async (child) => {
      const immutableChild = state.clientApplication.children.find((c) => c.information.socialInsuranceNumber === child.information?.socialInsuranceNumber);

      const selectedFederalGovernmentInsurancePlan = child.dentalBenefits?.federalSocialProgram ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale) : undefined;

      const selectedProvincialBenefit = child.dentalBenefits?.provincialTerritorialSocialProgram
        ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
        : undefined;

      const clientDentalBenefits = immutableChild?.dentalBenefits.flatMap(async (id) => {
        const federalProgram = await federalGovernmentInsurancePlanService.findLocalizedFederalGovernmentInsurancePlanById(id, locale);
        if (federalProgram.isSome()) return [federalProgram.unwrap().name];

        const provincialProgram = await provincialGovernmentInsurancePlanService.findLocalizedProvincialGovernmentInsurancePlanById(id, locale);
        if (provincialProgram.isSome()) return [provincialProgram.unwrap().name];

        return [];
      });

      const dentalBenefits = child.dentalBenefits
        ? [child.dentalBenefits.hasFederalBenefits && selectedFederalGovernmentInsurancePlan?.name, child.dentalBenefits.hasProvincialTerritorialBenefits && selectedProvincialBenefit?.name].filter(Boolean)
        : clientDentalBenefits;

      const idToken: IdToken = session.get('idToken');
      appContainer.get(TYPES.AuditService).createAudit('page-view.renew.review-child-information', { userId: idToken.sub });

      return {
        id: child.id,
        firstName: child.information?.firstName,
        lastName: child.information?.lastName,
        birthday: child.information?.dateOfBirth ?? '',
        clientNumber: child.information?.clientNumber,
        socialInsuranceNumber: child.information?.socialInsuranceNumber,
        acessToDentalInsurance: child.dentalInsurance,
        dentalBenefits,
        demographicSurvey: child.demographicSurvey,
      };
    }),
  );

  return { children, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedRenewState({ params, request, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const state = loadProtectedRenewState({ params, request, session });
  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.renew.review-child-information', { userId: idToken.sub });

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    saveProtectedRenewState({
      params,
      request,
      session,
      state: { editMode: false },
    });
    if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled)) {
      return redirect(getPathById('protected/renew/$id/communication-preference', params));
    }
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled)) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  return redirect(getPathById('protected/renew/$id/review-and-submit', params));
}

export default function ProtectedRenewReviewChildInformation({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();

  const { t } = useTranslation(handle.i18nNamespaces);
  const { children } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const demographicSurveyEnabled = useFeature('demographic-survey');

  return (
    <div className="max-w-prose">
      <p className="mb-4 text-lg">{t('protected-renew:review-child-information.read-carefully')}</p>
      <p className="mb-8 text-lg">
        <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:review-child-information.contact-service-canada" components={{ noWrap: <span className="whitespace-nowrap" /> }} />
      </p>
      <div className="space-y-10">
        {children.map((child) => {
          const childParams = { ...params, childId: child.id };
          const dateOfBirth = toLocaleDateString(parseDateString(child.birthday), currentLanguage);
          return (
            <section key={child.id} className="space-y-8">
              <h2 className="font-lato text-3xl font-bold">{child.firstName}</h2>
              <section className="space-y-6">
                <h3 className="font-lato text-2xl font-bold">{t('protected-renew:review-child-information.page-sub-title', { child: child.firstName })}</h3>
                <dl className="divide-y border-y">
                  <DescriptionListItem term={t('protected-renew:review-child-information.full-name-title')}>{`${child.firstName} ${child.lastName}`}</DescriptionListItem>
                  <DescriptionListItem term={t('protected-renew:review-child-information.dob-title')}>{dateOfBirth}</DescriptionListItem>
                  <DescriptionListItem term={t('protected-renew:review-child-information.client-number-title')}>{child.clientNumber}</DescriptionListItem>
                  <DescriptionListItem term={t('protected-renew:review-child-information.social-insurance-number-title')}>{child.socialInsuranceNumber}</DescriptionListItem>
                </dl>
              </section>
              <section className="space-y-6">
                <h3 className="font-lato text-2xl font-bold">{t('protected-renew:review-child-information.dental-title', { child: child.firstName })}</h3>
                <dl className="divide-y border-y">
                  <DescriptionListItem term={t('protected-renew:review-child-information.dental-insurance-title')}>
                    {child.acessToDentalInsurance ? t('protected-renew:review-child-information.yes') : t('protected-renew:review-child-information.no')}
                    <p className="mt-4">
                      <InlineLink id="change-access-dental" routeId="protected/renew/$id/$childId/dental-insurance" params={childParams}>
                        {t('protected-renew:review-child-information.dental-insurance-change')}
                      </InlineLink>
                    </p>
                  </DescriptionListItem>
                  {child.dentalBenefits && child.dentalBenefits.length > 0 && (
                    <DescriptionListItem term={t('protected-renew:review-child-information.dental-benefit-title')}>
                      <>
                        <p>{t('protected-renew:review-child-information.yes')}</p>
                        <p>{t('protected-renew:review-child-information.dental-benefit-has-access')}</p>
                        <ul className="ml-6 list-disc">
                          {child.dentalBenefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </>
                      <div className="mt-4">
                        <InlineLink id="change-dental-benefits" routeId="protected/renew/$id/children/$childId/confirm-federal-provincial-territorial-benefits" params={childParams}>
                          {t('protected-renew:review-child-information.dental-benefit-change')}
                        </InlineLink>
                      </div>
                    </DescriptionListItem>
                  )}
                  {child.dentalBenefits?.length === 0 && (
                    <DescriptionListItem term={t('protected-renew:review-child-information.dental-benefit-title')}>
                      <p>{t('protected-renew:review-child-information.no')}</p>
                      <div className="mt-4">
                        <InlineLink id="change-dental-benefits" routeId="protected/renew/$id/children/$childId/confirm-federal-provincial-territorial-benefits" params={childParams}>
                          {t('protected-renew:review-child-information.dental-benefit-change')}
                        </InlineLink>
                      </div>
                    </DescriptionListItem>
                  )}
                </dl>
              </section>
              {demographicSurveyEnabled && (
                <section className="space-y-6">
                  <h2 className="font-lato text-2xl font-bold">{t('protected-renew:review-child-information.demographic-survey-title')}</h2>
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('protected-renew:review-child-information.demographic-survey-title')}>
                      <p>{t('protected-renew:review-child-information.demographic-survey-responded')}</p>
                      <div className="mt-4">
                        <InlineLink id="change-demographic-survey" routeId="protected/renew/$id/$childId/demographic-survey" params={childParams}>
                          {t('protected-renew:review-child-information.demographic-survey-change')}
                        </InlineLink>
                      </div>
                    </DescriptionListItem>
                  </dl>
                </section>
              )}
            </section>
          );
        })}
      </div>
      <fetcher.Form method="post" className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
        <CsrfTokenInput />
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            id="confirm-button"
            name="_action"
            value={FORM_ACTION.submit}
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Review child(ren) information click"
          >
            {t('protected-renew:review-child-information.continue-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Review child(ren) information click">
            {t('protected-renew:review-child-information.back-button')}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
