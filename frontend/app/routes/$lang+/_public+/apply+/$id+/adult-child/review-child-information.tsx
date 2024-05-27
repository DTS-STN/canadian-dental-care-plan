import { SyntheticEvent, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button } from '~/components/buttons';
import { DebugPayload } from '~/components/debug-payload';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { toBenefitApplicationRequest } from '~/mappers/benefit-application-service-mappers.server';
import { useFeature } from '~/root';
import { loadApplyAdultChildState, validateApplyAdultChildStateForReview } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { clearApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
import { getBenefitApplicationService } from '~/services/benefit-application-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin } from '~/utils/sin-utils';

enum FormAction {
  Back = 'back',
  Submit = 'submit',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.reviewInformation,
  pageTitleI18nKey: 'apply-adult-child:review-child-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const lookupService = getLookupService();

  const state = loadApplyAdultChildState({ params, request, session });
  validateApplyAdultChildStateForReview({ params, state });

  const provincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();
  const federalSocialPrograms = await lookupService.getAllFederalSocialPrograms();
  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();

  // prettier-ignore
  if (state.children.length === 0) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const t = await getFixedT(request, handle.i18nNamespaces);

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:review-child-information.page-title') }) };

  // TODO update with correct state
  const payload = toBenefitApplicationRequest({
    typeOfApplication: state.typeOfApplication!,
    disabilityTaxCredit: state.disabilityTaxCredit!,
    livingIndependently: state.livingIndependently!,
    applicantInformation: state.applicantInformation!,
    communicationPreferences: state.communicationPreferences!,
    dateOfBirth: state.dateOfBirth!,
    dentalBenefits: state.dentalBenefits!,
    dentalInsurance: state.dentalInsurance!,
    personalInformation: state.personalInformation!,
    partnerInformation: state.partnerInformation!,
  });

  return json({
    id: state.id,
    children: state.children,
    federalSocialPrograms,
    provincialTerritorialSocialPrograms,
    csrfToken,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
    payload,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/review-child-information');

  const benefitApplicationService = getBenefitApplicationService();
  const { ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Back) {
    saveApplyState({ params, session, state: { editMode: false } });
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/review-adult-information', params));
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      clearApplyState({ params, session });
      return redirect(getPathById('$lang+/_public+/unable-to-process-request', params));
    }
  }

  const state = loadApplyAdultChildState({ params, request, session });
  validateApplyAdultChildStateForReview({ params, state });

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.children.length === 0 ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  // TODO submit to the API and grab the confirmation code from the response
  const benefitApplicationRequest = toBenefitApplicationRequest({
    typeOfApplication: state.typeOfApplication,
    disabilityTaxCredit: state.disabilityTaxCredit,
    livingIndependently: state.livingIndependently,
    applicantInformation: state.applicantInformation,
    communicationPreferences: state.communicationPreferences,
    dateOfBirth: state.dateOfBirth,
    dentalBenefits: state.dentalBenefits,
    dentalInsurance: state.dentalInsurance,
    personalInformation: state.personalInformation,
    partnerInformation: state.partnerInformation,
    children: state.children,
  });

  const confirmationCode = await benefitApplicationService.submitApplication(benefitApplicationRequest);

  saveApplyState({
    params,
    session,
    state: {
      submissionInfo: {
        confirmationCode: confirmationCode,
        submittedOn: new UTCDate().toISOString(),
      },
    },
  });

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/confirmation', params));
}

export default function ReviewInformation() {
  const params = useParams();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { children, federalSocialPrograms, provincialTerritorialSocialPrograms, csrfToken, siteKey, hCaptchaEnabled, payload } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { captchaRef } = useHCaptcha();

  const [isSubmitAction, setIsSubmitAction] = useState(false);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget, event.nativeEvent.submitter);
    setIsSubmitAction(formData.get('_action') === FormAction.Submit);
    if (hCaptchaEnabled && captchaRef.current) {
      try {
        const response = captchaRef.current.getResponse();
        formData.set('h-captcha-response', response);
      } catch (error) {
        /* intentionally ignore and proceed with submission */
      } finally {
        captchaRef.current.resetCaptcha();
      }
    }

    fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={100} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="my-4 text-lg">{t('apply-adult-child:review-child-information.read-carefully')}</p>
        {children.map((childData, index) => (
          <div key={childData.id} className="space-y-10">
            <h2 className="text-4xl font-semibold">{childData.information?.firstName}</h2>
            <div>
              <h2 className="text-2xl font-semibold">{t('apply-adult-child:review-child-information.page-sub-title', { child: childData.information?.firstName })}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('apply-adult-child:review-child-information.full-name-title')}>
                  {`${childData.information?.firstName} ${childData.information?.lastName}`}
                  <p className="mt-4">
                    <InlineLink id="change-full-name" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                      {t('apply-adult-child:review-child-information.full-name-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-child-information.dob-title')}>
                  {childData.information?.dateOfBirth}
                  <p className="mt-4">
                    <InlineLink id="change-date-of-birth" routeId="$lang+/_public+/apply+/$id+/adult/date-of-birth" params={params}>
                      {t('apply-adult-child:review-child-information.dob-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-child-information.sin-title')}>
                  {childData.information?.socialInsuranceNumber ? formatSin(childData.information?.socialInsuranceNumber) : ''}
                  <p className="mt-4">
                    <InlineLink id="change-sin" routeId="$lang+/_public+/apply+/$id+/adult/applicant-information" params={params}>
                      {t('apply-adult-child:review-child-information.sin-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-child-information.is-parent')}>
                  {childData.information?.isParent ? t('apply-adult-child:review-child-information.yes') : t('apply-adult-child:review-child-information.no')}
                </DescriptionListItem>
              </dl>
            </div>
            <div>
              <h2 className="mt-8 text-2xl font-semibold">{t('apply-adult-child:review-child-information.dental-title', { child: childData.information?.firstName })}</h2>
              <dl className="mt-6 divide-y border-y">
                <DescriptionListItem term={t('apply-adult-child:review-child-information.dental-insurance-title')}>
                  {childData.dentalInsurance ? t('apply-adult-child:review-child-information.yes') : t('apply-adult-child:review-child-information.no')}
                  <p className="mt-4">
                    <InlineLink id="change-access-dental" routeId="$lang+/_public+/apply+/$id+/adult/dental-insurance" params={params}>
                      {t('apply-adult-child:review-child-information.dental-insurance-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('apply-adult-child:review-child-information.dental-benefit-title')}>
                  {childData.dentalBenefits?.hasFederalBenefits ?? childData.dentalBenefits?.hasProvincialTerritorialBenefits ? (
                    <>
                      <p>{t('apply-adult-child:review-child-information.yes')}</p>
                      <p>{t('apply-adult-child:review-child-information.dental-benefit-has-access')}</p>
                      <div>
                        <ul className="ml-6 list-disc">
                          {childData.dentalBenefits.hasFederalBenefits && <li>{getNameByLanguage(i18n.language, federalSocialPrograms.find((p) => p.id === childData.dentalBenefits?.federalSocialProgram) ?? { nameEn: '', nameFr: '' })}</li>}
                          {childData.dentalBenefits.hasProvincialTerritorialBenefits && (
                            <li>
                              {getNameByLanguage(
                                i18n.language,
                                provincialTerritorialSocialPrograms.filter((p) => p.provinceTerritoryStateId === childData.dentalBenefits?.province).find((p) => p.id === childData.dentalBenefits?.provincialTerritorialSocialProgram) ?? {
                                  nameEn: '',
                                  nameFr: '',
                                },
                              )}
                            </li>
                          )}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>{t('apply-adult-child:review-child-information.no')}</>
                  )}
                  <p className="mt-4">
                    <InlineLink id="change-dental-benefits" routeId="$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits" params={params}>
                      {t('apply-adult-child:review-child-information.dental-benefit-change')}
                    </InlineLink>
                  </p>
                </DescriptionListItem>
              </dl>
            </div>
          </div>
        ))}
        <h2 className="mb-5 mt-8 text-2xl font-semibold">{t('apply-adult-child:review-child-information.submit-app-title')}</h2>
        <p className="mb-4">{t('apply-adult-child:review-child-information.submit-p-proceed')}</p>
        <p className="mb-4">{t('apply-adult-child:review-child-information.submit-p-false-info')}</p>
        <p className="mb-4">{t('apply-adult-child:review-child-information.submit-p-repayment')}</p>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button id="confirm-button" name="_action" value={FormAction.Submit} variant="green" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Submit - Review Child Information click">
              {t('apply-adult-child:review-child-information.submit-button')}
              {isSubmitting && !isSubmitAction && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
            </Button>
            <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Review Child Information click">
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply-adult-child:review-child-information.back-button')}
            </Button>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply-adult-child:review-adult-information.back-button')}
          </div>
        </fetcher.Form>
        <InlineLink routeId="$lang+/_public+/apply+/$id+/adult/exit-application" params={params} className="mt-4 block font-lato font-semibold">
          {t('apply-adult-child:review-child-information.exit-button')}
        </InlineLink>
      </div>
      {useFeature('view-payload') && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy></DebugPayload>
        </div>
      )}
    </>
  );
}
