import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { invariant } from '@dts-stn/invariant';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/review-child-information';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultChildStateForReview } from '~/.server/routes/helpers/protected-apply-adult-child-route-helpers';
import { clearProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DebugPayload } from '~/components/debug-payload';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { useCurrentLanguage } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useClientEnv, useFeature } from '~/root';
import { parseDateString, toLocaleDateString } from '~/utils/date-utils';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

const FORM_ACTION = {
  back: 'back',
  submit: 'submit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult-child', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adultChild.reviewChildInformation,
  pageTitleI18nKey: 'protected-apply-adult-child:review-child-information.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyAdultChildStateForReview({ params, request, session });

  // apply state is valid then edit mode can be set to true
  saveProtectedApplyState({
    params,
    session,
    state: {
      editMode: true,
    },
  });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult-child:review-child-information.page-title') }) };

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationStateMapper = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper);
  const benefitApplicationDtoMapper = appContainer.get(TYPES.domain.mappers.BenefitApplicationDtoMapper);
  const payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationStateMapper.mapApplyAdultChildStateToBenefitApplicationDto(state));

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.domain.services.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.domain.services.ProvincialGovernmentInsurancePlanService);

  const children = await Promise.all(
    state.children.map(async (child) => {
      // prettier-ignore
      const selectedFederalGovernmentInsurancePlan = child.dentalBenefits?.federalSocialProgram
      ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(child.dentalBenefits.federalSocialProgram, locale)
      : undefined;

      // prettier-ignore
      const selectedProvincialBenefit = child.dentalBenefits?.provincialTerritorialSocialProgram
      ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(child.dentalBenefits.provincialTerritorialSocialProgram, locale)
      : undefined;

      return {
        id: child.id,
        firstName: child.information.firstName,
        lastName: child.information.lastName,
        birthday: child.information.dateOfBirth,
        sin: child.information.socialInsuranceNumber,
        isParent: child.information.isParent,
        dentalInsurance: {
          acessToDentalInsurance: child.dentalInsurance,
          federalBenefit: {
            access: child.dentalBenefits?.hasFederalBenefits,
            benefit: selectedFederalGovernmentInsurancePlan?.name,
          },
          provTerrBenefit: {
            access: child.dentalBenefits?.hasProvincialTerritorialBenefits,
            province: child.dentalBenefits?.province,
            benefit: selectedProvincialBenefit?.name,
          },
        },
      };
    }),
  );

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.adult-child.review-child-information', { userId: idToken.sub });

  return { children, meta, payload };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedApplyState({ params, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    saveProtectedApplyState({ params, session, state: {} });
    return redirect(getPathById('protected/apply/$id/adult-child/review-adult-information', params));
  }

  const state = loadProtectedApplyAdultChildStateForReview({ params, request, session });
  const benefitApplicationDto = appContainer.get(TYPES.routes.mappers.BenefitApplicationStateMapper).mapApplyAdultChildStateToBenefitApplicationDto(state);
  const confirmationCode = await appContainer.get(TYPES.domain.services.BenefitApplicationService).createProtectedBenefitApplication(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };

  saveProtectedApplyState({ params, session, state: { submissionInfo } });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.adult-child.review-child-information', { userId: idToken.sub });

  return redirect(getPathById('protected/apply/$id/adult-child/confirmation', params));
}

export default function ReviewInformation({ loaderData, params }: Route.ComponentProps) {
  const { currentLanguage } = useCurrentLanguage();

  const { t } = useTranslation(handle.i18nNamespaces);
  const { children, payload } = loaderData;
  const hCaptchaEnabled = useFeature('hcaptcha');
  const { HCAPTCHA_SITE_KEY } = useClientEnv();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { captchaRef } = useHCaptcha();
  const [submitAction, setSubmitAction] = useState<string>();

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // Get the clicked button's value and append it to the FormData object
    const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
    invariant(submitter, 'Expected submitter to be defined');
    formData.append(submitter.name, submitter.value);

    setSubmitAction(submitter.value);

    if (hCaptchaEnabled && captchaRef.current) {
      try {
        const response = captchaRef.current.getResponse();
        formData.set('h-captcha-response', response);
      } catch {
        /* intentionally ignore and proceed with submission */
      } finally {
        captchaRef.current.resetCaptcha();
      }
    }

    await fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={99} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="my-4 text-lg">{t('protected-apply-adult-child:review-child-information.read-carefully')}</p>
        <div className="space-y-10">
          {children.map((child) => {
            const childParams = { ...params, childId: child.id };
            const dateOfBirth = toLocaleDateString(parseDateString(child.birthday), currentLanguage);
            return (
              <section key={child.id} className="space-y-8">
                <h2 className="font-lato text-3xl font-bold">{child.firstName}</h2>
                <section className="space-y-6">
                  <h3 className="font-lato text-2xl font-bold">{t('protected-apply-adult-child:review-child-information.page-sub-title', { child: child.firstName })}</h3>
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('protected-apply-adult-child:review-child-information.full-name-title')}>
                      {`${child.firstName} ${child.lastName}`}
                      <p className="mt-4">
                        <InlineLink id="change-full-name" routeId="protected/apply/$id/adult-child/children/$childId/information" params={childParams}>
                          {t('protected-apply-adult-child:review-child-information.full-name-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected-apply-adult-child:review-child-information.dob-title')}>
                      {dateOfBirth}
                      <p className="mt-4">
                        <InlineLink id="change-date-of-birth" routeId="protected/apply/$id/adult-child/children/$childId/information" params={childParams}>
                          {t('protected-apply-adult-child:review-child-information.dob-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected-apply-adult-child:review-child-information.sin-title')}>
                      {child.sin && formatSin(child.sin)}
                      <p className="mt-4">
                        <InlineLink id="change-sin" routeId="protected/apply/$id/adult-child/children/$childId/information" params={childParams}>
                          {t('protected-apply-adult-child:review-child-information.sin-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected-apply-adult-child:review-child-information.is-parent')}>
                      {child.isParent ? t('protected-apply-adult-child:review-child-information.yes') : t('protected-apply-adult-child:review-child-information.no')}
                    </DescriptionListItem>
                  </dl>
                </section>
                <section className="space-y-6">
                  <h3 className="font-lato text-2xl font-bold">{t('protected-apply-adult-child:review-child-information.dental-title', { child: child.firstName })}</h3>
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('protected-apply-adult-child:review-child-information.dental-insurance-title')}>
                      {child.dentalInsurance.acessToDentalInsurance ? t('protected-apply-adult-child:review-child-information.yes') : t('protected-apply-adult-child:review-child-information.no')}
                      <p className="mt-4">
                        <InlineLink id="change-access-dental" routeId="protected/apply/$id/adult-child/children/$childId/dental-insurance" params={childParams}>
                          {t('protected-apply-adult-child:review-child-information.dental-insurance-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected-apply-adult-child:review-child-information.dental-benefit-title')}>
                      {child.dentalInsurance.federalBenefit.access || child.dentalInsurance.provTerrBenefit.access ? (
                        <>
                          <p>{t('protected-apply-adult-child:review-child-information.yes')}</p>
                          <p>{t('protected-apply-adult-child:review-child-information.dental-benefit-has-access')}</p>
                          <div>
                            <ul className="ml-6 list-disc">
                              {child.dentalInsurance.federalBenefit.access && <li>{child.dentalInsurance.federalBenefit.benefit}</li>}
                              {child.dentalInsurance.provTerrBenefit.access && <li>{child.dentalInsurance.provTerrBenefit.benefit}</li>}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>{t('protected-apply-adult-child:review-child-information.no')}</>
                      )}
                      <p className="mt-4">
                        <InlineLink id="change-dental-benefits" routeId="protected/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits" params={childParams}>
                          {t('protected-apply-adult-child:review-child-information.dental-benefit-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                  </dl>
                </section>
              </section>
            );
          })}
          <section className="space-y-4">
            <h2 className="font-lato text-2xl font-bold">{t('protected-apply-adult-child:review-child-information.submit-app-title')}</h2>
            <p className="mb-4">{t('protected-apply-adult-child:review-child-information.submit-p-proceed')}</p>
            <p className="mb-4">{t('protected-apply-adult-child:review-child-information.submit-p-false-info')}</p>
            <p className="mb-4">{t('protected-apply-adult-child:review-child-information.submit-p-repayment')}</p>
          </section>
        </div>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <CsrfTokenInput />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={HCAPTCHA_SITE_KEY} ref={captchaRef} />}
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              id="confirm-button"
              name="_action"
              value={FORM_ACTION.submit}
              variant="green"
              disabled={isSubmitting}
              loading={isSubmitting && submitAction === FORM_ACTION.submit}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Submit - Review child(ren) information click"
            >
              {t('protected-apply-adult-child:review-child-information.submit-button')}
            </LoadingButton>
            <Button
              id="back-button"
              name="_action"
              value={FORM_ACTION.back}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult_Child:Exit - Review child(ren) information click"
            >
              {t('protected-apply-adult-child:review-child-information.back-button')}
            </Button>
          </div>
        </fetcher.Form>
        <div className="mt-8">
          <InlineLink routeId="protected/apply/$id/adult-child/exit-application" params={params}>
            {t('protected-apply-adult-child:review-child-information.exit-button')}
          </InlineLink>
        </div>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy />
        </div>
      )}
    </>
  );
}
