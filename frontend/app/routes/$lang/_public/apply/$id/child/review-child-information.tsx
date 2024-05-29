import { SyntheticEvent, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { Progress } from '~/components/progress';
import { loadApplyChildState, validateApplyChildStateForReview } from '~/route-helpers/apply-child-route-helpers.server';
import { clearApplyState, getChildrenState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getHCaptchaRouteHelpers } from '~/route-helpers/h-captcha-route-helpers.server';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.reviewInformation,
  pageTitleI18nKey: 'apply-child:review-child-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyChildState({ params, request, session });
  validateApplyChildStateForReview({ params, state });

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined ||
    getChildrenState(state).length === 0) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();
  const t = await getFixedT(request, handle.i18nNamespaces);
  const lookupService = getLookupService();
  const provincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();
  const federalSocialPrograms = await lookupService.getAllFederalSocialPrograms();

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:review-child-information.page-title') }) };

  return json({
    id: state.id,
    children: state.children,
    federalSocialPrograms,
    provincialTerritorialSocialPrograms,
    csrfToken,
    meta,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply-child/review-adult-information');

  const state = loadApplyChildState({ params, request, session });
  validateApplyChildStateForReview({ params, state });

  // prettier-ignore
  if (state.applicantInformation === undefined ||
    state.communicationPreferences === undefined ||
    state.dateOfBirth === undefined ||
    state.dentalBenefits === undefined ||
    state.dentalInsurance === undefined ||
    state.personalInformation === undefined ||
    state.taxFiling2023 === undefined ||
    state.typeOfApplication === undefined ||
    getChildrenState(state).length === 0) {
    throw new Error(`Incomplete application "${state.id}" state!`);
  }

  const { ENABLED_FEATURES } = getEnv();
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse(hCaptchaResponse, request))) {
      clearApplyState({ params, session });
      return redirect(getPathById('$lang/_public/unable-to-process-request', params));
    }
  }

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));

  if (formAction === FormAction.Back) {
    saveApplyState({ params, session, state: { editMode: false } });
    return redirect(getPathById('$lang/_public/apply/$id/child/communication-preference', params));
  }

  saveApplyState({
    params,
    session,
    state: {},
  });

  return redirect(getPathById('$lang/_public/apply/$id/child/review-adult-information', params));
}

export default function ReviewInformation() {
  const params = useParams();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { children, federalSocialPrograms, provincialTerritorialSocialPrograms, csrfToken, siteKey, hCaptchaEnabled } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { captchaRef } = useHCaptcha();

  const [submitAction, setSubmitAction] = useState<string>();

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget, event.nativeEvent.submitter);

    setSubmitAction(String(formData.get('_action')));
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
        <p className="my-4 text-lg">{t('apply-child:review-child-information.read-carefully')}</p>
        <div className="mb-8 space-y-10">
          {children.map((child) => {
            const childParams = { ...params, childId: child.id };
            return (
              <section key={child.id} className="space-y-10">
                <h2 className="font-lato text-3xl font-semibold">{child.information?.firstName}</h2>
                <div>
                  <h3 className="mb-6 font-lato text-2xl font-semibold">{t('apply-child:review-child-information.page-sub-title', { child: child.information?.firstName })}</h3>
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('apply-child:review-child-information.full-name-title')}>
                      {`${child.information?.firstName} ${child.information?.lastName}`}
                      <p className="mt-4">
                        <InlineLink id="change-full-name" routeId="$lang/_public/apply/$id/child/children/$childId/information" params={childParams}>
                          {t('apply-child:review-child-information.full-name-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('apply-child:review-child-information.dob-title')}>
                      {child.information?.dateOfBirth}
                      <p className="mt-4">
                        <InlineLink id="change-date-of-birth" routeId="$lang/_public/apply/$id/child/children/$childId/information" params={childParams}>
                          {t('apply-child:review-child-information.dob-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('apply-child:review-child-information.sin-title')}>
                      {child.information?.socialInsuranceNumber ? formatSin(child.information.socialInsuranceNumber) : ''}
                      <p className="mt-4">
                        <InlineLink id="change-sin" routeId="$lang/_public/apply/$id/child/children/$childId/information" params={childParams}>
                          {t('apply-child:review-child-information.sin-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('apply-child:review-child-information.is-parent')}>{child.information?.isParent ? t('apply-child:review-child-information.yes') : t('apply-child:review-child-information.no')}</DescriptionListItem>
                  </dl>
                </div>
                <div>
                  <h3 className="mb-6 font-lato text-2xl font-semibold">{t('apply-child:review-child-information.dental-title', { child: child.information?.firstName })}</h3>
                  <dl className="divide-y border-y">
                    <DescriptionListItem term={t('apply-child:review-child-information.dental-insurance-title')}>
                      {child.dentalInsurance ? t('apply-child:review-child-information.yes') : t('apply-child:review-child-information.no')}
                      <p className="mt-4">
                        <InlineLink id="change-access-dental" routeId="$lang/_public/apply/$id/child/children/$childId/dental-insurance" params={childParams}>
                          {t('apply-child:review-child-information.dental-insurance-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                    <DescriptionListItem term={t('apply-child:review-child-information.dental-benefit-title')}>
                      {child.dentalBenefits?.hasFederalBenefits ?? child.dentalBenefits?.hasProvincialTerritorialBenefits ? (
                        <>
                          <p>{t('apply-child:review-child-information.yes')}</p>
                          <p>{t('apply-child:review-child-information.dental-benefit-has-access')}</p>
                          <div>
                            <ul className="ml-6 list-disc">
                              {child.dentalBenefits.hasFederalBenefits && <li>{getNameByLanguage(i18n.language, federalSocialPrograms.find((p) => p.id === child.dentalBenefits?.federalSocialProgram) ?? { nameEn: '', nameFr: '' })}</li>}
                              {child.dentalBenefits.hasProvincialTerritorialBenefits && (
                                <li>
                                  {getNameByLanguage(
                                    i18n.language,
                                    provincialTerritorialSocialPrograms.filter((p) => p.provinceTerritoryStateId === child.dentalBenefits?.province).find((p) => p.id === child.dentalBenefits?.provincialTerritorialSocialProgram) ?? {
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
                        <>{t('apply-child:review-child-information.no')}</>
                      )}
                      <p className="mt-4">
                        <InlineLink id="change-dental-benefits" routeId="$lang/_public/apply/$id/child/children/$childId/federal-provincial-territorial-benefits" params={childParams}>
                          {t('apply-child:review-child-information.dental-benefit-change')}
                        </InlineLink>
                      </p>
                    </DescriptionListItem>
                  </dl>
                </div>
              </section>
            );
          })}
        </div>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="mt-6 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}

          <Button variant="primary" id="continue-button" name="_action" value={FormAction.Submit} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Review Child Information click">
            {t('apply-child:review-child-information.continue-button')}
            {isSubmitting && submitAction === FormAction.Submit ? <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" /> : <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />}
          </Button>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Review Information click">
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply-child:review-child-information.back-button')}
          </Button>
        </fetcher.Form>
      </div>
    </>
  );
}
