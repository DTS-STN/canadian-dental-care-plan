import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/email';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const PREFERRED_LANGUAGE = { en: 'English', fr: 'French' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.email,
  pageTitleI18nKey: 'apply-adult-child:email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:email.page-title') }) };

  return {
    id: state.id,
    meta,
    defaultState: state.email,
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const verificationCodeService = appContainer.get(TYPES.domain.services.VerificationCodeService);

  const emailSchema = z
    .object({
      email: z
        .string({ errorMap: () => ({ message: t('apply-adult-child:email.error-message.email-required') }) })
        .trim()
        .min(1)
        .max(64),
    })
    .superRefine((val, ctx) => {
      if (!validator.isEmail(val.email)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:email.error-message.email-valid'), path: ['email'] });
      }
    });

  const parsedDataResult = emailSchema.safeParse({
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const isNewEmail = state.email !== parsedDataResult.data.email;
  const verificationCode = isNewEmail || state.verifyEmail === undefined ? verificationCodeService.createVerificationCode('anonymous') : state.verifyEmail.verificationCode;

  invariant(state.communicationPreferences, 'Expected state.communicationPreferences to be defined');
  if (isNewEmail) {
    const preferredLanguageService = appContainer.get(TYPES.domain.services.PreferredLanguageService);
    const preferredLanguage = preferredLanguageService.getLocalizedPreferredLanguageById(state.communicationPreferences.preferredLanguage, locale).name;

    await verificationCodeService.sendVerificationCodeEmail({
      email: parsedDataResult.data.email,
      verificationCode,
      preferredLanguage: preferredLanguage === PREFERRED_LANGUAGE.en ? 'en' : 'fr',
      userId: 'anonymous',
    });
  }

  saveApplyState({
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

  if (state.editMode) {
    // Redirect to /verify-email only if emailVerified is false
    if (isNewEmail || !state.emailVerified) {
      return redirect(getPathById('public/apply/$id/adult-child/verify-email', params));
    }
    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  if (isNewEmail || !state.emailVerified) {
    return redirect(getPathById('public/apply/$id/adult-child/verify-email', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/dental-insurance', params));
}

export default function ApplyFlowEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { email: 'email' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={62} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <p className="mb-4">{t('apply-adult-child:email.provide-email')}</p>
            <p className="mb-8">{t('apply-adult-child:email.verify-email')}</p>
            <p className="mb-4 italic">{t('apply:required-label')}</p>
            <div className="grid items-end gap-6 md:grid-cols-2">
              <InputField
                id="email"
                name="email"
                type="email"
                inputMode="email"
                className="w-full"
                autoComplete="email"
                defaultValue={defaultState}
                errorMessage={errors?.email}
                label={t('apply-adult-child:email.email-legend')}
                maxLength={64}
                aria-describedby="adding-email"
                required
              />
            </div>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Email click">
                {t('apply-adult-child:email.save-btn')}
              </Button>
              <ButtonLink id="back-button" routeId="public/apply/$id/adult/review-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Email click">
                {t('apply-adult-child:email.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Email click">
                {t('apply-adult-child:email.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/communication-preference"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Email click"
              >
                {t('apply-adult-child:email.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
