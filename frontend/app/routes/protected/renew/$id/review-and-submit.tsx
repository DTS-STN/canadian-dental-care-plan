import type { SyntheticEvent } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { clearProtectedRenewState, isPrimaryApplicantStateComplete, loadProtectedRenewState, loadProtectedRenewStateForReview, saveProtectedRenewState, validateProtectedChildrenStateForReview } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { UserinfoToken } from '~/.server/utils/raoidc.utils';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Submit = 'submit',
  Back = 'back',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.reviewSubmit,
  pageTitleI18nKey: 'protected-renew:review-submit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = appContainer.get(TYPES.configs.ClientConfig);
  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:review-submit.page-title') }) };

  const primaryApplicantName = isPrimaryApplicantStateComplete(state, demographicSurveyEnabled) ? `${state.clientApplication.applicantInformation.firstName} ${state.clientApplication.applicantInformation.lastName}` : undefined;
  const children = validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled);

  return {
    meta,
    primaryApplicantName,
    children,
    siteKey: HCAPTCHA_SITE_KEY,
    hCaptchaEnabled,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.validateHCaptchaResponse({ formData, request }, () => {
    clearProtectedRenewState({ params, session });
    throw redirect(getPathById('protected/unable-to-process-request', params));
  });

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const state = loadProtectedRenewStateForReview({ params, session, demographicSurveyEnabled });
  const children = validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled);

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Back) {
    if (children.length > 0) return redirect(getPathById('protected/renew/$id/review-child-information', params));
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  const userInfoToken = session.get<UserinfoToken>('userInfoToken');
  const benefitRenewalDto = appContainer.get(TYPES.routes.mappers.BenefitRenewalStateMapper).mapProtectedRenewStateToProtectedBenefitRenewalDto(state, userInfoToken.sub);
  await appContainer.get(TYPES.domain.services.BenefitRenewalService).createProtectedBenefitRenewal(benefitRenewalDto);

  const submissionInfo = { submittedOn: new UTCDate().toISOString() };
  saveProtectedRenewState({ params, session, state: { submissionInfo } });

  return redirect(getPathById('protected/renew/$id/confirmation', params));
}

export default function ProtectedRenewReviewSubmit() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { primaryApplicantName, children, hCaptchaEnabled, siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const { captchaRef } = useHCaptcha();
  const [submitAction, setSubmitAction] = useState<string>();

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
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

    fetcher.submit(formData, { method: 'POST' });
  }

  return (
    <div className="max-w-prose">
      <p className="mb-4">{t('protected-renew:review-submit.form-instructions')}</p>
      <ul className="my-6 list-inside list-disc space-y-2">
        {primaryApplicantName && <li>{primaryApplicantName}</li>}
        {children.map((child) => {
          const childName = `${child.information?.firstName} ${child.information?.lastName}`;
          return <li key={childName}>{childName}</li>;
        })}
      </ul>
      <p className="mb-4">{t('protected-renew:review-submit.submit-p-proceed')}</p>
      <p className="mb-4">{t('protected-renew:review-submit.submit-p-false-info')}</p>
      <p className="mb-4">{t('protected-renew:review-submit.submit-p-repayment')}</p>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
        <CsrfTokenInput />
        {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            id="submit-button"
            name="_action"
            value={FormAction.Submit}
            variant="green"
            loading={isSubmitting && submitAction === FormAction.Submit}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application Form:Continue - Review and submit click"
          >
            {t('protected-renew:review-submit.submit-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application Form:Back - Review and submit click">
            {t('protected-renew:review-submit.back-button')}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
