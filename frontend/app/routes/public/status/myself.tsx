import type { FormEvent } from 'react';
import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../page-ids.json';
import { TYPES } from '~/.server/constants';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { LoadingButton } from '~/components/loading-button';
import { getHCaptchaRouteHelpers } from '~/route-helpers/hcaptcha-route-helpers.server';
import { getStatusResultUrl, saveStatusState, startStatusState } from '~/route-helpers/status-route-helpers.server';
import { applicationCodeInputPatternFormat, isValidCodeOrNumber } from '~/utils/application-code-utils';
import { featureEnabled } from '~/utils/env-utils.server';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { extractDigits } from '~/utils/string-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.myself,
  pageTitleI18nKey: 'status:myself.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('status');
  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = appContainer.get(TYPES.SERVER_CONFIG);

  const csrfToken = String(session.get('csrfToken'));
  const t = await getFixedT(request, handle.i18nNamespaces);

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:myself.page-title') }) };

  return json({ csrfToken, hCaptchaEnabled, meta, siteKey: HCAPTCHA_SITE_KEY });
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  featureEnabled('status');
  const log = getLogger('status/myself/index');
  const { ENABLED_FEATURES } = appContainer.get(TYPES.SERVER_CONFIG);
  const hCaptchaRouteHelpers = getHCaptchaRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formDataSchema = z.object({
    sin: z
      .string({ required_error: t('status:myself.form.error-message.sin-required') })
      .trim()
      .min(1)
      .refine(isValidSin, t('status:myself.form.error-message.sin-valid'))
      .transform((sin) => formatSin(sin, '')),
    code: z
      .string({ required_error: t('status:myself.form.error-message.application-code-required') })
      .trim()
      .min(1)
      .refine(isValidCodeOrNumber, t('status:myself.form.error-message.application-code-valid'))
      .transform((code) => extractDigits(code)),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    sin: formData.get('sin') ? String(formData.get('sin')) : undefined,
    code: formData.get('code') ? String(formData.get('code')) : undefined,
  };

  const parsedDataResult = formDataSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');
  if (hCaptchaEnabled) {
    const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');
    const hCaptchaService = appContainer.get(TYPES.HCAPTCHA_SERVICE);
    if (!(await hCaptchaRouteHelpers.verifyHCaptchaResponse({ hCaptchaService, hCaptchaResponse, request }))) {
      return redirect(getPathById('public/unable-to-process-request', params));
    }
  }

  const { sin, code } = parsedDataResult.data;
  const statusId = await appContainer.get(TYPES.APPLICATION_STATUS_SERVICE).findApplicationStatusIdBySin({ sin, applicationCode: code, userId: 'anonymous' });

  const id = randomUUID().toString();
  startStatusState({ id, session });
  saveStatusState({
    id,
    params,
    session,
    state: {
      statusCheckResult: {
        statusId,
      },
    },
  });

  return redirect(getStatusResultUrl({ id, params }));
}

export default function StatusCheckerMyself() {
  const { csrfToken, hCaptchaEnabled, siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const { t } = useTranslation(handle.i18nNamespaces);
  const { captchaRef } = useHCaptcha();
  const params = useParams();

  const errors = fetcher.data && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, { code: 'code', sin: 'sin' });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

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

  useEffect(() => {
    if (fetcher.data && 'statusId' in fetcher.data) {
      const targetElement = document.getElementById('status');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        targetElement.focus();
      }
    }
  }, [fetcher.data]);

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('status:myself.form.complete-fields')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate autoComplete="off" data-gc-analytics-formname="ESDC-EDSC: Canadian Dental Care Plan Status Checker">
        <input type="hidden" name="_csrf" value={csrfToken} />
        {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />}
        <div className="mb-8 space-y-6">
          <InputPatternField
            id="code"
            name="code"
            format={applicationCodeInputPatternFormat}
            label={t('status:myself.form.application-code-label')}
            inputMode="numeric"
            helpMessagePrimary={t('status:myself.form.application-code-description')}
            required
            errorMessage={errors?.code}
            defaultValue=""
          />
          <InputPatternField id="sin" name="sin" format={sinInputPatternFormat} label={t('status:myself.form.sin-label')} helpMessagePrimary={t('status:myself.form.sin-description')} required errorMessage={errors?.sin} defaultValue="" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" routeId="public/status/index" params={params} startIcon={faChevronLeft} disabled={isSubmitting}>
            {t('status:myself.form.back-btn')}
          </ButtonLink>
          <LoadingButton variant="primary" id="submit" loading={isSubmitting} data-gc-analytics-formsubmit="submit" endIcon={faChevronRight}>
            {t('status:myself.form.submit')}
          </LoadingButton>
        </div>
      </fetcher.Form>
    </div>
  );
}
