import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
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
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.email,
  pageTitleI18nKey: 'protected-profile:email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:email.page-title') }) };

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.email-address', { userId: idToken.sub });

  return {
    meta,
    defaultState: clientApplication.contactInformation.email,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const userInfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sub, 'Expected userInfoToken.sub to be defined');

  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);
  const idToken = session.get('idToken');

  const emailSchema = z
    .object({
      email: z
        .string({ error: t('protected-profile:email.error-message.email-required') })
        .trim()
        .min(1)
        .max(64),
    })
    .superRefine((val, ctx) => {
      if (!validator.isEmail(val.email)) {
        ctx.addIssue({ code: 'custom', message: t('protected-profile:email.error-message.email-valid'), path: ['email'] });
      }
    });

  const parsedDataResult = emailSchema.safeParse({
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.email-address', { userId: idToken.sub });

  // TODO: check if existing email is verified otherwise we must verify it
  const isNewEmail = clientApplication.contactInformation.email !== parsedDataResult.data.email;

  if (isNewEmail) {
    const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);
    const verificationCode = verificationCodeService.createVerificationCode(idToken.sub);

    session.set('profileEmailVerificationState', {
      pendingEmail: parsedDataResult.data.email,
      verificationCode,
      verificationAttempts: 0,
    });

    await verificationCodeService.sendVerificationCodeEmail({
      email: parsedDataResult.data.email,
      verificationCode,
      preferredLanguage: clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
      userId: idToken.sub,
    });

    return redirect(getPathById('protected/profile/contact/email-address/verify', params));
  }

  return redirect(getPathById('protected/profile/contact-information', params));
}

export default function ProtectedProfileEmailAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { email: 'email' });

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <p className="mb-4">{t('protected-profile:email.provide-email')}</p>
        <p className="mb-8">{t('protected-profile:email.verify-email')}</p>
        <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputField id="email" name="email" type="email" inputMode="email" className="w-full" autoComplete="email" defaultValue={defaultState} errorMessage={errors?.email} label={t('protected-profile:email.email-legend')} maxLength={64} required />
        </div>

        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" loading={isSubmitting}>
            {t('protected-profile:email.save-btn')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="protected/profile/contact-information" params={params} disabled={isSubmitting}>
            {t('protected-profile:email.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
