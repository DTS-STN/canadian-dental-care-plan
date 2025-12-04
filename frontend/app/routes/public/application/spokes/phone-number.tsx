import { data, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/phone-number';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
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
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.phoneNumber,
  pageTitleI18nKey: 'application-spokes:phone-number.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:phone-number.page-title') }) };
  return {
    defaultState: {
      phoneNumber: state.contactInformation?.phoneNumber,
      phoneNumberAlt: state.contactInformation?.phoneNumberAlt,
    },
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z.object({
    phoneNumber: phoneSchema({
      invalid_phone_canadian_error: t('application-spokes:phone-number.error-message.phone-number-valid'),
      invalid_phone_international_error: t('application-spokes:phone-number.error-message.phone-number-valid-international'),
    }).optional(),
    phoneNumberAlt: phoneSchema({
      invalid_phone_canadian_error: t('application-spokes:phone-number.error-message.phone-number-alt-valid'),
      invalid_phone_international_error: t('application-spokes:phone-number.error-message.phone-number-alt-valid-international'),
    }).optional(),
  });

  const parsedDataResult = phoneNumberSchema.safeParse({
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({
    params,
    session,
    state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } },
  });
}

export default function PhoneNumber({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

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
          <p className="mb-4 italic">{t('application:optional-label')}</p>
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
              label={t('application-spokes:phone-number.phone-number')}
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
              label={t('application-spokes:phone-number.phone-number-alt')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Phone number click">
            {t('application-spokes:phone-number.save-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId={'public/application/$id/new-adult/contact-information'}
            params={params}
            disabled={isSubmitting}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Phone number click"
          >
            {t('application-spokes:phone-number.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
