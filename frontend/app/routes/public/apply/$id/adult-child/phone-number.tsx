import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/phone-number';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { phoneSchema } from '~/.server/validation/phone-schema';
import { Button, ButtonLink } from '~/components/buttons';
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

const FORM_ACTION = {
  cancel: 'cancel',
  save: 'save',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.phoneNumber,
  pageTitleI18nKey: 'apply-adult-child:phone-number.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:phone-number.page-title') }) };

  return {
    id: state.id,
    meta,
    defaultState: {
      phoneNumber: state.contactInformation?.phoneNumber,
      phoneNumberAlt: state.contactInformation?.phoneNumberAlt,
    },
    editMode: state.editMode,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const phoneNumberSchema = z.object({
    phoneNumber: phoneSchema({
      invalid_phone_canadian_error: t('apply-adult-child:phone-number.error-message.phone-number-valid'),
      invalid_phone_international_error: t('apply-adult-child:phone-number.error-message.phone-number-valid-international'),
    }).optional(),
    phoneNumberAlt: phoneSchema({
      invalid_phone_canadian_error: t('apply-adult-child:phone-number.error-message.phone-number-alt-valid'),
      invalid_phone_international_error: t('apply-adult-child:phone-number.error-message.phone-number-alt-valid-international'),
    }).optional(),
  });

  const parsedDataResult = phoneNumberSchema.safeParse({
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  // TODO: Uncomment when address routes are available
  // saveApplyState({ params, session, state: { contactInformation: { ...state.contactInformation, ...parsedDataResult.data } } });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/communication-preference', params));
}

export default function ApplyFlowPhoneNumber({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
  });

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('apply:optional-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-6">
          <p className="mb-4">{t('apply-adult-child:phone-number.help-message')}</p>
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
              label={t('apply-adult-child:phone-number.phone-number')}
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
              label={t('apply-adult-child:phone-number.phone-number-alt')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
          </div>
        </div>
        {editMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Save - Phone Number click">
              {t('apply-adult-child:phone-number.save-btn')}
            </Button>
            <ButtonLink
              id="cancel-button"
              routeId="public/apply/$id/adult-child/review-adult-information"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Cancel - Phone Number click"
            >
              {t('apply-adult-child:phone-number.cancel-btn')}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Continue - Phone number click">
              {t('apply-adult-child:phone-number.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="public/apply/$id/adult-child/applicant-information" //TODO: refactor route id when address routes are available
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Back - Phone number click"
            >
              {t('apply-adult-child:phone-number.back-btn')}
            </ButtonLink>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}
