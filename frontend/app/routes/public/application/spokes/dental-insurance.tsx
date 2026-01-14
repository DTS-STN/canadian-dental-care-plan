import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const CHECKBOX_VALUE = {
  yes: 'yes',
} as const;

const HAS_DENTAL_INSURANCE_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.dentalInsurance,
  pageTitleI18nKey: 'application-spokes:dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-adult', 'new-children', 'new-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:dental-insurance.title') }) };

  return {
    defaultState: state.dentalInsurance,
    typeAndFlow: `${state.typeOfApplication}-${state.typeOfApplicationFlow}`,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-adult', 'new-children', 'new-family']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const dentalInsuranceSchema = z
    .object({
      hasDentalInsurance: z.boolean({ error: t('application-spokes:dental-insurance.error-message.dental-insurance-required') }),
      dentalInsuranceEligibilityConfirmation: z.string().trim().optional(),
    })
    .transform((val) => ({
      ...val,
      dentalInsuranceEligibilityConfirmation: val.dentalInsuranceEligibilityConfirmation ? val.dentalInsuranceEligibilityConfirmation === CHECKBOX_VALUE.yes : undefined,
    }));

  const parsedDataResult = dentalInsuranceSchema.safeParse({
    hasDentalInsurance: formData.get('hasDentalInsurance') ? formData.get('hasDentalInsurance') === 'yes' : undefined,
    dentalInsuranceEligibilityConfirmation: formData.get('dentalInsuranceEligibilityConfirmation') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  if (!parsedDataResult.data.dentalInsuranceEligibilityConfirmation) {
    return redirect(getPathById('public/application/$id/dental-insurance-exit-application', params));
  }

  savePublicApplicationState({ params, session, state: { dentalInsurance: parsedDataResult.data } });

  return redirect(getPathById(`public/application/$id/${state.typeOfApplication}-${state.typeOfApplicationFlow}/dental-insurance`, params));
}

export default function ApplicationSpokeDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, typeAndFlow } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [hasDentalInsurance, setHasDentalInsurance] = useState(defaultState?.hasDentalInsurance);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasDentalInsurance: 'input-radio-has-dental-insurance-option-0',
    dentalInsuranceEligibilityConfirmation: 'input-checkbox-dental-insurance-eligibility-confirmation',
  });

  function handleOnHasDentalInsuranceChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasDentalInsurance(e.target.value === HAS_DENTAL_INSURANCE_OPTION.yes);
  }

  const helpMessage = (
    <div className="mb-4 space-y-4">
      <ul className="list-disc space-y-1 pl-7">
        <li>{t('dental-insurance.detail.additional-info.list.employer')}</li>
        <li>{t('dental-insurance.detail.additional-info.list.pension')}</li>
        <li>{t('dental-insurance.detail.additional-info.list.pension-plans')}</li>
        <li>{t('dental-insurance.detail.additional-info.list.organization')}</li>
        <li>{t('dental-insurance.detail.additional-info.list.company')}</li>
      </ul>
      <p>{t('dental-insurance.detail.additional-info.eligible')}</p>
      <p>{t('dental-insurance.detail.additional-info.access')}</p>
    </div>
  );

  const t4Href = <InlineLink to={t('application-spokes:dental-insurance.alert-no.t4-href')} className="external-link" newTabIndicator target="_blank" />;
  const t4aHref = <InlineLink to={t('application-spokes:dental-insurance.alert-no.t4a-href')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('application:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="my-6">
          <InputRadios
            id="has-dental-insurance"
            name="hasDentalInsurance"
            legend={t('dental-insurance.legend')}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-insurance.option-yes" />,
                value: HAS_DENTAL_INSURANCE_OPTION.yes,
                defaultChecked: defaultState?.hasDentalInsurance === true,
                onChange: handleOnHasDentalInsuranceChanged,
              },
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-insurance.option-no" />,
                value: HAS_DENTAL_INSURANCE_OPTION.no,
                defaultChecked: defaultState?.hasDentalInsurance === false,
                onChange: handleOnHasDentalInsuranceChanged,
              },
            ]}
            helpMessagePrimary={helpMessage}
            helpMessagePrimaryClassName="text-black"
            errorMessage={errors?.hasDentalInsurance}
            required
          />
        </div>
        {hasDentalInsurance === true && (
          <div className="mb-4">
            <ContextualAlert type="info">
              <h3 className="font-lato mb-2 text-xl font-semibold">{t('dental-insurance.alert-yes.title')}</h3>
              <p>{t('dental-insurance.alert-yes.body')}</p>
            </ContextualAlert>
          </div>
        )}
        {hasDentalInsurance === false && (
          <div className="mb-4">
            <ContextualAlert type="info">
              <h3 className="font-lato mb-2 text-xl font-semibold">{t('dental-insurance.alert-no.title')}</h3>
              <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:dental-insurance.alert-no.body" components={{ t4Href, t4aHref }} />
            </ContextualAlert>
          </div>
        )}
        <InputCheckbox
          id="dental-insurance-eligibility-confirmation"
          name="dentalInsuranceEligibilityConfirmation"
          value={CHECKBOX_VALUE.yes}
          defaultChecked={defaultState?.dentalInsuranceEligibilityConfirmation}
          errorMessage={errors?.dentalInsuranceEligibilityConfirmation}
          required
        >
          {t('dental-insurance.dental-insurance-eligibility-confirmation')}
        </InputCheckbox>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Access to other dental insurance click">
            {t('dental-insurance.button.continue')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId={`public/application/$id/${typeAndFlow}/dental-insurance`}
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Access to other dental insurance click"
          >
            {t('dental-insurance.button.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
