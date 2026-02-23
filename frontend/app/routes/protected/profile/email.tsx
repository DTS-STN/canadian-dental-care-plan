import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import type { Route } from './+types/email';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

// prettier-ignore
const profileEmailContextSchema = z
  .object({
    context: z.literal('contact').optional(),
    // eslint-disable-next-line unicorn/no-useless-undefined
    pref_lang: z.any().transform(() => undefined).optional(),
    // eslint-disable-next-line unicorn/no-useless-undefined
    pref_method_sl: z.any().transform(() => undefined).optional(),
    // eslint-disable-next-line unicorn/no-useless-undefined
    pref_method_goc: z.any().transform(() => undefined).optional(),
  })
  .or(
    z.object({
      context: z.literal('communication-preferences'),
      pref_lang: z.string(),
      pref_method_sl: z.string(),
      pref_method_goc: z.string(),
    }),
  );

export type ProfileEmailContext = z.infer<typeof profileEmailContextSchema>;

function requireProfileEmailContext({ request, params }: Pick<Route.LoaderArgs | Route.ActionArgs, 'request' | 'params'>): ProfileEmailContext {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const parsed = profileEmailContextSchema.safeParse(searchParams);

  if (!parsed.success) {
    throw redirect(getPathById('protected/profile/contact/email-address', params));
  }

  return parsed.data;
}

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'protected-profile:contact-information.page-title', routeId: 'protected/profile/contact-information' }],
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.email,
  pageTitleI18nKey: 'protected-profile:email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });
  const profileEmailContext = requireProfileEmailContext({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:email.page-title') }) };

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.email-address', { userId: idToken.sub });

  return {
    meta,
    defaultState: clientApplication.contactInformation.email,
    context: profileEmailContext.context,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });
  const profileEmailContext = requireProfileEmailContext({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);
  const idToken = session.get('idToken');

  const emailSchema = z.object({
    email: z
      .string(t('protected-profile:email.error-message.email-required'))
      .trim()
      .toLowerCase()
      .min(1)
      .max(64)
      .refine((val) => validator.isEmail(val), t('protected-profile:email.error-message.email-valid')),
  });

  const parsedDataResult = emailSchema.safeParse({
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.email-address', { userId: idToken.sub });

  const isNewEmail =
    clientApplication.contactInformation.email !== parsedDataResult.data.email ||
    clientApplication.contactInformation.email.localeCompare(parsedDataResult.data.email, undefined, { sensitivity: 'accent' }) !== 0 ||
    clientApplication.contactInformation.emailVerified === false;

  if (isNewEmail) {
    const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);
    const verificationCode = verificationCodeService.createVerificationCode(idToken.sub);

    session.set(
      'profileEmailAddressFlowState',
      profileEmailContext.context === 'communication-preferences'
        ? {
            context: profileEmailContext.context,
            preferredLanguage: profileEmailContext.pref_lang,
            preferredMethodSunLife: profileEmailContext.pref_method_sl,
            preferredMethodGovernmentOfCanada: profileEmailContext.pref_method_goc,
            emailAddress: parsedDataResult.data.email,
            verificationCode,
            verificationAttempts: 0,
          }
        : {
            context: profileEmailContext.context,
            emailAddress: parsedDataResult.data.email,
            verificationCode,
            verificationAttempts: 0,
          },
    );

    await verificationCodeService.sendVerificationCodeEmail({
      email: parsedDataResult.data.email,
      verificationCode,
      preferredLanguage: clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
      userId: idToken.sub,
    });

    return redirect(getPathById('protected/profile/contact/email-address/verify', params));
  }

  if (profileEmailContext.context === 'communication-preferences') {
    return redirect(getPathById('protected/profile/communication-preferences', params));
  }

  return redirect(getPathById('protected/profile/contact-information', params));
}

export default function ProtectedProfileEmailAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, context } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { email: 'email' });

  const backButtonRouteId = context === 'communication-preferences' ? 'protected/profile/communication-preferences/edit' : 'protected/profile/contact-information';

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <p className="mb-4">{t('protected-profile:email.provide-email')}</p>
        <p className="mb-8">{t('protected-profile:email.verify-email')}</p>
        <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
        <div className="mb-6">
          <InputField id="email" name="email" type="email" inputMode="email" className="w-full" autoComplete="email" defaultValue={defaultState} errorMessage={errors?.email} label={t('protected-profile:email.email-legend')} maxLength={64} required />
        </div>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Save - Email address click">
            {t('protected-profile:email.continue-btn')}
          </LoadingButton>
          <ButtonLink variant="secondary" id="back-button" routeId={backButtonRouteId} params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Back - Email address click">
            {t('protected-profile:email.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
