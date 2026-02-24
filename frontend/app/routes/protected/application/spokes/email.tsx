import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/email';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { ApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

function getRouteFromApplicationFlow(applicationFlow: ApplicationFlow) {
  switch (applicationFlow) {
    case 'intake-children': {
      return `protected/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    default: {
      return `protected/application/$id/${applicationFlow}/contact-information`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.email,
  pageTitleI18nKey: 'protected-application-spokes:email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-adult', 'intake-children', 'intake-family', 'renewal-adult', 'renewal-family', 'renewal-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:email.page-title') }) };
  return {
    defaultState: state.email,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-adult', 'intake-children', 'intake-family', 'renewal-adult', 'renewal-family', 'renewal-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicationFlow: ApplicationFlow = `${state.context}-${state.typeOfApplication}`;

  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);

  const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);

  const emailSchema = z
    .object({
      email: z
        .string({ error: t('protected-application-spokes:email.error-message.email-required') })
        .trim()
        .min(1)
        .max(64),
    })

    .superRefine((val, ctx) => {
      if (!validator.isEmail(val.email)) {
        ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:email.error-message.email-valid'), path: ['email'] });
      }
    });

  const parsedDataResult = emailSchema.safeParse({
    email: formData.get('email')?.toString(),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const isNewEmail = state.email !== parsedDataResult.data.email;
  const verificationCode = isNewEmail || state.verifyEmail === undefined ? verificationCodeService.createVerificationCode('anonymous') : state.verifyEmail.verificationCode;

  if (isNewEmail) {
    await verificationCodeService.sendVerificationCodeEmail({
      email: parsedDataResult.data.email,
      verificationCode,
      preferredLanguage: state.communicationPreferences?.value?.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
      userId: 'anonymous',
    });
  }

  saveProtectedApplicationState({
    params,
    session,
    state: {
      email: parsedDataResult.data.email,
      emailVerified: isNewEmail ? false : state.emailVerified,
      ...(isNewEmail && {
        verifyEmail: {
          verificationCode,
          verificationAttempts: 0,
        },
      }),
    },
  });

  if (isNewEmail || !state.emailVerified) {
    return redirect(getPathById('protected/application/$id/verify-email', params));
  }

  return redirect(getPathById(getRouteFromApplicationFlow(applicationFlow), params));
}

export default function ApplicationEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  return (
    <div className="max-w-prose">
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <p className="mb-4">{t('protected-application-spokes:email.provide-email')}</p>
          <p className="mb-8">{t('protected-application-spokes:email.verify-email')}</p>
          <p className="mb-4 italic">{t('protected-application:required-label')}</p>
          <div className="mb-6">
            <InputField
              id="email"
              name="email"
              type="email"
              inputMode="email"
              className="w-full"
              autoComplete="email"
              defaultValue={defaultState}
              errorMessage={errors?.email}
              label={t('protected-application-spokes:email.email-legend')}
              maxLength={64}
              required
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Continue - Email click">
              {t('protected-application-spokes:email.continue')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="protected/application/$id/communication-preferences"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Back - Email click"
            >
              {t('protected-application-spokes:email.back')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
