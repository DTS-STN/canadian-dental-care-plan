import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadRenewAdultChildState } from '~/route-helpers/renew-adult-child-route-helpers.server';
import { saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum AddressRadioOptions {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmAddress,
  pageTitleI18nKey: 'renew-adult-child:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm-address.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: { hasAddressChanged: state.hasAddressChanged, isHomeAddressSameAsMailingAddress: state.isHomeAddressSameAsMailingAddress } });
}

export async function action({ context: { configProvider, serviceProvider, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/adult-child/confirm-address');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmAddressSchema = z
    .object({
      hasAddressChanged: z.nativeEnum(AddressRadioOptions, {
        errorMap: () => ({ message: t('renew-adult-child:confirm-address.error-message.has-address-changed-required') }),
      }),
      isHomeAddressSameAsMailingAddress: z.nativeEnum(AddressRadioOptions).or(z.literal('')).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasAddressChanged === AddressRadioOptions.Yes) {
        if (!val.isHomeAddressSameAsMailingAddress) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-adult-child:confirm-address.error-message.is-home-address-same-as-mailing-address-required'), path: ['isHomeAddressSameAsMailingAddress'] });
        }
      }
    })
    .transform((val) => ({
      ...val,
      isHomeAddressSameAsMailingAddress: val.isHomeAddressSameAsMailingAddress ? val.isHomeAddressSameAsMailingAddress : undefined,
    }));

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { hasAddressChanged: formData.get('hasAddressChanged'), isHomeAddressSameAsMailingAddress: formData.get('isHomeAddressSameAsMailingAddress') ?? '' };
  const parsedDataResult = confirmAddressSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  saveRenewState({
    params,
    session,
    state: {
      hasAddressChanged: parsedDataResult.data.hasAddressChanged === AddressRadioOptions.Yes,
      isHomeAddressSameAsMailingAddress: parsedDataResult.data.hasAddressChanged === AddressRadioOptions.Yes ? parsedDataResult.data.isHomeAddressSameAsMailingAddress === AddressRadioOptions.Yes : undefined,
    },
  });

  if (parsedDataResult.data.hasAddressChanged === AddressRadioOptions.No) {
    return redirect(getPathById('public/renew/$id/adult-child/dental-insurance', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/update-address', params));
}

export default function RenewAdultChildConfirmAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasAddressChanged: 'input-radio-has-address-changed-option-0',
    isHomeAddressSameAsMailingAddress: 'input-radio-is-home-address-same-as-mailing-address-option-0',
  });

  const [hasAddressChangedRadioValue, setHasAddressChangeRadioValue] = useState(defaultState.hasAddressChanged);

  function handleHasAddressChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasAddressChangeRadioValue(e.target.value === AddressRadioOptions.Yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={22} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="space-y-6">
            <InputRadios
              id="has-address-changed"
              name="hasAddressChanged"
              legend={t('renew-adult-child:confirm-address.have-you-moved')}
              options={[
                { value: AddressRadioOptions.Yes, children: t('renew-adult-child:confirm-address.radio-options.yes'), defaultChecked: defaultState.hasAddressChanged === true, onChange: handleHasAddressChanged },
                { value: AddressRadioOptions.No, children: t('renew-adult-child:confirm-address.radio-options.no'), defaultChecked: defaultState.hasAddressChanged === false, onChange: handleHasAddressChanged },
              ]}
              helpMessagePrimary={t('renew-adult-child:confirm-address.help-message')}
              errorMessage={errors?.hasAddressChanged}
              required
            />
            {hasAddressChangedRadioValue && (
              <InputRadios
                id="is-home-address-same-as-mailing-address"
                name="isHomeAddressSameAsMailingAddress"
                legend={t('renew-adult-child:confirm-address.is-home-address-same-as-mailing-address')}
                options={[
                  { value: AddressRadioOptions.Yes, children: t('renew-adult-child:confirm-address.radio-options.yes'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === true },
                  { value: AddressRadioOptions.No, children: t('renew-adult-child:confirm-address.radio-options.no'), defaultChecked: defaultState.isHomeAddressSameAsMailingAddress === false },
                ]}
                errorMessage={errors?.isHomeAddressSameAsMailingAddress}
                required
              />
            )}
          </div>

          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Confirm address click">
              {t('renew-adult-child:confirm-address.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="public/renew/$id/adult-child/confirm-email"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Confirm address click"
            >
              {t('renew-adult-child:confirm-address.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
