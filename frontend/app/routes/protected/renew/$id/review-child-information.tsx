import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { clearProtectedRenewState, isPrimaryApplicantStateComplete, loadProtectedRenewState, saveProtectedRenewState, validateProtectedChildrenStateForReview } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { UserinfoToken } from '~/.server/utils/raoidc.utils';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DebugPayload } from '~/components/debug-payload';
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
import { formatSin } from '~/utils/sin-utils';

enum FormAction {
  Back = 'back',
  Submit = 'submit',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.reviewChildInformation,
  pageTitleI18nKey: 'protected-renew:review-child-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, session });
  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');
  const validatedChildren = validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled);

  // renew state is valid then edit mode can be set to true
  saveProtectedRenewState({ params, session, state: { editMode: true } });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:review-child-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');

  const userInfoToken = session.get<UserinfoToken>('userInfoToken');

  // prettier-ignore
  const payload =
    viewPayloadEnabled &&
    appContainer
      .get(TYPES.domain.mappers.BenefitRenewalDtoMapper)
      .mapProtectedBenefitRenewalDtoToBenefitRenewalRequestEntity(appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper).mapProtectedRenewStateToProtectedBenefitRenewalDto(state, userInfoToken.sub));

  const children = validatedChildren.map((child) => {
    const immutableChild = state.clientApplication.children.find((c) => c.information.socialInsuranceNumber === child.information?.socialInsuranceNumber);

    const selectedFederalGovernmentInsurancePlan = child.dentalBenefits?.federalSocialProgram
      ? appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale)
      : undefined;

    const selectedProvincialBenefit = child.dentalBenefits?.provincialTerritorialSocialProgram
      ? appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
      : undefined;

    const clientDentalBenefits = immutableChild?.dentalBenefits.map((id) => {
      try {
        const federalBenefit = appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService).getLocalizedFederalGovernmentInsurancePlanById(id, locale);
        return federalBenefit.name;
      } catch {
        const provincialBenefit = appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService).getLocalizedProvincialGovernmentInsurancePlanById(id, locale);
        return provincialBenefit.name;
      }
    });

    const dentalBenefits = child.dentalBenefits
      ? [child.dentalBenefits.hasFederalBenefits && selectedFederalGovernmentInsurancePlan?.name, child.dentalBenefits.hasProvincialTerritorialBenefits && selectedProvincialBenefit?.name].filter(Boolean)
      : clientDentalBenefits;

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
  });

  return { id: state.id, children, meta, payload };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedRenewState({ params, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const state = loadProtectedRenewState({ params, session });
  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Back) {
    if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled)) {
      return redirect(getPathById('protected/renew/$id/member-selection', params));
    }
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  return redirect(getPathById('protected/renew/$id/review-and-submit', params));
}

export default function ProtectedRenewReviewChildInformation() {
  const { currentLanguage } = useCurrentLanguage();
  const params = useParams();
  const { t } = useTranslation(handle.i18nNamespaces);
  const { children, payload } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const demographicSurveyEnabled = useFeature('demographic-survey');

  return (
    <>
      <div className="max-w-prose">
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
                    <DescriptionListItem term={t('protected-renew:review-child-information.social-insurance-number-title')}>{formatSin(child.socialInsuranceNumber ?? '')}</DescriptionListItem>
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
              value={FormAction.Submit}
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
              endIcon={faChevronRight}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Submit - Review child(ren) information click"
            >
              {t('protected-renew:review-child-information.continue-button')}
            </LoadingButton>
            <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Exit - Review child(ren) information click">
              {t('protected-renew:review-child-information.back-button')}
            </Button>
          </div>
        </fetcher.Form>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy />
        </div>
      )}
    </>
  );
}
