import type { FormEvent } from 'react';
import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { getStatusResultUrl, saveStatusState, startStatusState } from '~/.server/routes/helpers/status-route-helpers';
import { featureEnabled } from '~/.server/utils/env.utils';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { LoadingButton } from '~/components/loading-button';
import { useEnhancedFetcher } from '~/hooks';
import { pageIds } from '~/page-ids';
import { useClientEnv, useFeature } from '~/root';
import { applicationCodeInputPatternFormat, isValidCodeOrNumber } from '~/utils/application-code-utils';
import { useHCaptcha } from '~/utils/hcaptcha-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { extractDigits } from '~/utils/string-utils';

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
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('status:myself.page-title') }) };
  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  featureEnabled('status');

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateCsrfToken(request);
  await securityHandler.validateHCaptchaResponse(request, () => {
    throw redirect(getPathById('public/unable-to-process-request', params));
  });

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

  const data = {
    sin: formData.get('sin') ? String(formData.get('sin')) : undefined,
    code: formData.get('code') ? String(formData.get('code')) : undefined,
  };

  const parsedDataResult = formDataSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  const { sin, code } = parsedDataResult.data;
  const statusId = await appContainer.get(TYPES.domain.services.ApplicationStatusService).findApplicationStatusIdBySin({ sin, applicationCode: code, userId: 'anonymous' });

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
  const { t } = useTranslation(handle.i18nNamespaces);
  const hCaptchaEnabled = useFeature('hcaptcha');
  const { HCAPTCHA_SITE_KEY } = useClientEnv();
  const { captchaRef } = useHCaptcha();
  const params = useParams();

  const fetcher = useEnhancedFetcher<typeof action>();
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
        {hCaptchaEnabled && <HCaptcha size="invisible" sitekey={HCAPTCHA_SITE_KEY} ref={captchaRef} />}
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
          <ButtonLink id="back-button" routeId="public/status/index" params={params} startIcon={faChevronLeft} disabled={fetcher.isSubmitting}>
            {t('status:myself.form.back-btn')}
          </ButtonLink>
          <LoadingButton variant="primary" id="submit" loading={fetcher.isSubmitting} data-gc-analytics-formsubmit="submit" endIcon={faChevronRight}>
            {t('status:myself.form.submit')}
          </LoadingButton>
        </div>
      </fetcher.Form>
    </div>
  );
}
