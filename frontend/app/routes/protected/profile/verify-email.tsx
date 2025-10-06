import { useEffect, useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/verify-email';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/dialog';
import { useErrorAlert } from '~/components/error-alert';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputField } from '~/components/input-field';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { extractDigits } from '~/utils/string-utils';

const FORM_ACTION = {
  request: 'request',
  submit: 'submit',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.verifyEmail,
  pageTitleI18nKey: 'protected-profile:verify-email.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:verify-email.page-title') }) };

  const userInfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.ApplicationYearService);
  const applicationYear = applicationYearService.getRenewalApplicationYear(currentDate);

  const clientApplicationService = appContainer.get(TYPES.ClientApplicationService);
  const clientApplicationResult = await clientApplicationService.findClientApplicationBySin({ sin: userInfoToken.sin, applicationYearId: applicationYear.applicationYearId, userId: userInfoToken.sub });

  if (clientApplicationResult.isNone()) {
    throw redirect(getPathById('protected/data-unavailable', params));
  }

  const clientApplication = clientApplicationResult.unwrap();

  return {
    meta,
    email: clientApplication.contactInformation.email,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const idToken: IdToken = session.get('idToken');
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const { ENGLISH_LANGUAGE_CODE } = appContainer.get(TYPES.ServerConfig);

  const userInfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.ApplicationYearService);
  const applicationYear = applicationYearService.getRenewalApplicationYear(currentDate);

  const clientApplicationService = appContainer.get(TYPES.ClientApplicationService);
  const clientApplicationResult = await clientApplicationService.findClientApplicationBySin({ sin: userInfoToken.sin, applicationYearId: applicationYear.applicationYearId, userId: userInfoToken.sub });

  if (clientApplicationResult.isNone()) {
    throw redirect(getPathById('protected/data-unavailable', params));
  }

  const clientApplication = clientApplicationResult.unwrap();

  // TODO: handle verification logic without the use of state (code below is left in to prevent breaking the UI)

  // Fetch verification code service
  const verificationCodeService = appContainer.get(TYPES.VerificationCodeService);

  const formAction = z.enum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.request) {
    // Create a new verification code and store the code in session
    const verificationCode = verificationCodeService.createVerificationCode(idToken.sub);
    await verificationCodeService.sendVerificationCodeEmail({
      email: clientApplication.contactInformation.email ?? '',
      verificationCode: verificationCode,
      preferredLanguage: clientApplication.communicationPreferences.preferredLanguage === ENGLISH_LANGUAGE_CODE.toString() ? 'en' : 'fr',
      userId: idToken.sub,
    });
    return { status: 'verification-code-sent' } as const;
  }

  const verificationCodeSchema = z.object({
    verificationCode: z.string().trim().min(1, t('protected-profile:verify-email.error-message.verification-code-required')).transform(extractDigits),
  });

  const parsedDataResult = verificationCodeSchema.safeParse({
    verificationCode: formData.get('verificationCode') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  // Check if the verification code matches
  if (clientApplication.contactInformation.email && parsedDataResult.data.verificationCode !== '12345') {
    return { status: 'verification-code-mismatch' } as const;
  }

  return redirect(getPathById('protected/profile/contact-information', params));
}

export default function ProtectedProfileVerifyEmail({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { email } = loaderData;
  const [showDialog, setShowDialog] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;
  const errorSummary = useErrorSummary(errors, { verificationCode: 'verification-code' });
  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'verification-code-mismatch');

  const communicationLink = <InlineLink routeId="protected/profile/communication-preferences" params={params} />;

  useEffect(() => {
    if (fetcherStatus === 'verification-code-sent') {
      setShowDialog(true);
    }
  }, [fetcherStatus, fetcher.data]);

  return (
    <div className="max-w-prose">
      <ErrorAlert>
        <h2 className="mb-2 font-bold">{t('protected-profile:verify-email.verification-code-alert.heading')}</h2>
        <p className="mb-2">{t('protected-profile:verify-email.verification-code-alert.detail')}</p>
      </ErrorAlert>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <p className="mb-4">{t('protected-profile:verify-email.verification-code', { email })}</p>
          <p className="mb-4">{t('protected-profile:verify-email.request-new')}</p>
          <p className="mb-8">
            <Trans ns={handle.i18nNamespaces} i18nKey="protected-profile:verify-email.unable-to-verify" components={{ communicationLink }} />
          </p>
          <p className="mb-4 italic">{t('protected-profile:required-label')}</p>
          <div className="grid items-end gap-6 md:grid-cols-2">
            <InputField
              id="verification-code"
              name="verificationCode"
              className="w-full"
              errorMessage={errors?.verificationCode}
              label={t('protected-profile:verify-email.verification-code-label')}
              aria-describedby="verification-code"
              inputMode="numeric"
              required
            />
          </div>
          <LoadingButton
            id="request-button"
            type="button"
            name="_action"
            variant="link"
            className="no-underline hover:underline"
            loading={isSubmitting}
            value={FORM_ACTION.request}
            onClick={async () => {
              const formData = new FormData();
              formData.append('_action', FORM_ACTION.request);

              const csrfTokenInput = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
              formData.append('_csrf', csrfTokenInput.value);

              await fetcher.submit(formData, { method: 'post' });
            }}
          >
            {t('protected-profile:verify-email.request-new-code')}
          </LoadingButton>
        </fieldset>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="continue-button" name="_action" value={FORM_ACTION.submit} loading={isSubmitting}>
            {t('protected-profile:verify-email.continue')}
          </LoadingButton>
          <ButtonLink id="back-button" routeId="protected/profile/contact/email-address" params={params} disabled={isSubmitting}>
            {t('protected-profile:verify-email.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('protected-profile:verify-email.code-sent.heading')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{t('protected-profile:verify-email.code-sent.detail', { email })}</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button id="modal-continue" disabled={isSubmitting} variant="primary" size="sm">
                {t('protected-profile:verify-email.continue')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
