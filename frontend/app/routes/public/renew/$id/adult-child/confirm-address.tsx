import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-address';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
  save: 'save',
} as const;

const ADDRESS_RADIO_OPTIONS = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmAddress,
  pageTitleI18nKey: 'renew-adult-child:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  if (!data) {
    return [];
  }

  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm-address.page-title') }) };

  invariant(state.communicationPreferences, 'Expected state.communicationPreferences to be defined');
  const backToEmail = state.communicationPreferences.preferredMethod === PREFERRED_SUN_LIFE_METHOD.email || state.communicationPreferences.preferredNotificationMethod !== PREFERRED_NOTIFICATION_METHOD.mail;

  return { meta, defaultState: { hasAddressChanged: state.hasAddressChanged }, backToEmail, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewAdultChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z.object({
    hasAddressChanged: z.nativeEnum(ADDRESS_RADIO_OPTIONS, {
      errorMap: () => ({ message: t('renew-adult-child:confirm-address.error-message.has-address-changed-required') }),
    }),
  });

  const parsedDataResult = confirmAddressSchema.safeParse({
    hasAddressChanged: formData.get('hasAddressChanged'),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      hasAddressChanged: parsedDataResult.data.hasAddressChanged === ADDRESS_RADIO_OPTIONS.yes,
      homeAddress: state.editMode && parsedDataResult.data.hasAddressChanged === ADDRESS_RADIO_OPTIONS.no ? undefined : state.homeAddress,
      mailingAddress: state.editMode && parsedDataResult.data.hasAddressChanged === ADDRESS_RADIO_OPTIONS.no ? undefined : state.mailingAddress,
      previousAddressState: {
        hasAddressChanged: state.hasAddressChanged,
        isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress,
      },
    },
  });

  if (parsedDataResult.data.hasAddressChanged === ADDRESS_RADIO_OPTIONS.yes) {
    return redirect(getPathById('public/renew/$id/adult-child/update-mailing-address', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-adult-information', params));
  }
  return redirect(getPathById('public/renew/$id/adult-child/dental-insurance', params));
}

export default function RenewAdultChildConfirmAddress({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, backToEmail, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasAddressChanged: 'input-radio-has-address-changed-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={55} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="space-y-6">
            <InputRadios
              id="has-address-changed"
              name="hasAddressChanged"
              legend={t('renew-adult-child:confirm-address.have-you-moved')}
              options={[
                { value: ADDRESS_RADIO_OPTIONS.yes, children: t('renew-adult-child:confirm-address.radio-options.yes'), defaultChecked: defaultState.hasAddressChanged === true },
                { value: ADDRESS_RADIO_OPTIONS.no, children: t('renew-adult-child:confirm-address.radio-options.no'), defaultChecked: defaultState.hasAddressChanged === false },
              ]}
              helpMessagePrimary={t('renew-adult-child:confirm-address.help-message')}
              errorMessage={errors?.hasAddressChanged}
              required
            />
          </div>

          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Save - Address click">
                {t('renew-adult-child:confirm-address.save-btn')}
              </Button>
              <ButtonLink id="cancel-button" routeId="public/renew/$id/adult-child/review-adult-information" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Cancel - Address click">
                {t('renew-adult-child:confirm-address.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Continue - Address click">
                {t('renew-adult-child:confirm-address.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={backToEmail ? 'public/renew/$id/adult-child/confirm-email' : 'public/renew/$id/adult-child/communication-preference'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Back - Address click"
              >
                {t('renew-adult-child:confirm-address.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
