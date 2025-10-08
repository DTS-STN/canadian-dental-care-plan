import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/phone-number';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { phoneSchema } from '~/.server/validation/phone-schema';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputPhoneField } from '~/components/input-phone-field';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.phoneNumber,
  pageTitleI18nKey: 'protected-profile:phone-number.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:phone-number.page-title') }) };

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.phone-number', { userId: idToken.sub });

  return {
    meta,
    defaultState: {
      phoneNumber: clientApplication.contactInformation.phoneNumber,
      phoneNumberAlt: clientApplication.contactInformation.phoneNumberAlt,
    },
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });
  await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z.object({
    phoneNumber: phoneSchema({
      invalid_phone_canadian_error: t('protected-profile:phone-number.error-message.phone-number-valid'),
      invalid_phone_international_error: t('protected-profile:phone-number.error-message.phone-number-valid-international'),
    }).optional(),
    phoneNumberAlt: phoneSchema({
      invalid_phone_canadian_error: t('protected-profile:phone-number.error-message.phone-number-alt-valid'),
      invalid_phone_international_error: t('protected-profile:phone-number.error-message.phone-number-alt-valid-international'),
    }).optional(),
  });

  const parsedDataResult = phoneNumberSchema.safeParse({
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  await appContainer.get(TYPES.ProfileService).updatePhoneNumbers(parsedDataResult.data);

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.profile.phone-number', { userId: idToken.sub });

  return redirect(getPathById('protected/profile/contact-information', params));
}

export default function PhoneNumber({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
  });

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-6">
          <p className="mb-4">{t('protected-profile:phone-number.help-message')}</p>
          <p className="mb-4 italic">{t('protected-profile:all-optional-label')}</p>
          <div className="grid items-end gap-6">
            <InputPhoneField
              id="phone-number"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              className="w-full"
              autoComplete="tel"
              defaultValue={defaultState.phoneNumber ?? ''}
              errorMessage={errors?.phoneNumber}
              label={t('protected-profile:phone-number.phone-number')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
            <InputPhoneField
              id="phone-number-alt"
              name="phoneNumberAlt"
              type="tel"
              inputMode="tel"
              className="w-full"
              autoComplete="tel"
              defaultValue={defaultState.phoneNumberAlt ?? ''}
              errorMessage={errors?.phoneNumberAlt}
              label={t('protected-profile:phone-number.phone-number-alt')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Save - Phone number click">
            {t('protected-profile:phone-number.save-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            routeId="protected/profile/applicant-information" //TODO: update with correct route when it's merged
            params={params}
            disabled={isSubmitting}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Back - Phone number click"
          >
            {t('protected-profile:phone-number.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
