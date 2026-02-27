import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.dentalInsurance,
  pageTitleI18nKey: 'protected-application-spokes:dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['renewal-adult', 'intake-adult', 'intake-children', 'intake-family', 'renewal-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:dental-insurance.title') }) };

  return {
    defaultState: state.dentalInsurance
      ? {
          hasDentalInsurance: state.dentalInsurance.hasDentalInsurance,
          dentalInsuranceEligibilityConfirmationYes: state.dentalInsurance.hasDentalInsurance === true ? state.dentalInsurance.dentalInsuranceEligibilityConfirmation : undefined,
          dentalInsuranceEligibilityConfirmationNo: state.dentalInsurance.hasDentalInsurance === false ? state.dentalInsurance.dentalInsuranceEligibilityConfirmation : undefined,
        }
      : undefined,
    applicationFlow: `${state.context}-${state.typeOfApplication}` as const,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-adult', 'intake-children', 'intake-family', 'renewal-adult', 'renewal-family']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const dentalInsuranceSchema = z
    .object({
      hasDentalInsurance: z.boolean({ error: t('protected-application-spokes:dental-insurance.error-message.dental-insurance-required') }),
      dentalInsuranceEligibilityConfirmationYes: z.boolean({ error: t('protected-application-spokes:dental-insurance.error-message.dental-insurance-eligibility-confirmation-required') }),
      dentalInsuranceEligibilityConfirmationNo: z.boolean({ error: t('protected-application-spokes:dental-insurance.error-message.dental-insurance-eligibility-confirmation-required') }),
    })
    .superRefine(({ hasDentalInsurance, dentalInsuranceEligibilityConfirmationYes }, ctx) => {
      if (hasDentalInsurance && dentalInsuranceEligibilityConfirmationYes === false) {
        return ctx.addIssue({
          code: 'custom',
          message: t('protected-application-spokes:dental-insurance.error-message.dental-insurance-eligibility-confirmation-required'),
          path: ['dentalInsuranceEligibilityConfirmationYes'],
        });
      }
    });

  const parsedDataResult = dentalInsuranceSchema.safeParse({
    hasDentalInsurance: formData.get('hasDentalInsurance') ? formData.get('hasDentalInsurance') === HAS_DENTAL_INSURANCE_OPTION.yes : undefined,
    dentalInsuranceEligibilityConfirmationYes: formData.get('dentalInsuranceEligibilityConfirmationYes') === CHECKBOX_VALUE.yes,
    dentalInsuranceEligibilityConfirmationNo: formData.get('dentalInsuranceEligibilityConfirmationNo') === CHECKBOX_VALUE.yes,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveProtectedApplicationState({
    params,
    session,
    state: {
      dentalInsurance: {
        hasDentalInsurance: parsedDataResult.data.hasDentalInsurance,
        dentalInsuranceEligibilityConfirmation: parsedDataResult.data.hasDentalInsurance ? parsedDataResult.data.dentalInsuranceEligibilityConfirmationYes : parsedDataResult.data.dentalInsuranceEligibilityConfirmationNo,
      },
    },
  });

  if (!parsedDataResult.data.hasDentalInsurance && !parsedDataResult.data.dentalInsuranceEligibilityConfirmationNo) {
    return redirect(getPathById('protected/application/$id/dental-insurance-exit-application', params));
  }

  return redirect(getPathById(`protected/application/$id/${state.context}-${state.typeOfApplication}/dental-insurance`, params));
}

export default function ApplicationSpokeDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, applicationFlow } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const [hasDentalInsurance, setHasDentalInsurance] = useState(defaultState?.hasDentalInsurance);

  const errors = fetcher.data?.errors;

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

  const t4Href = <InlineLink to={t('protected-application-spokes:dental-insurance.no.alert-t4-href')} className="external-link" newTabIndicator target="_blank" />;
  const t4aHref = <InlineLink to={t('protected-application-spokes:dental-insurance.no.alert-t4a-href')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <ErrorSummaryProvider actionData={fetcher.data}>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('protected-application:required-label')}</p>
        <ErrorSummary />
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
            <div className="mb-4 space-y-4">
              <ContextualAlert type="info">
                <h3 className="font-lato mb-2 text-xl font-semibold">{t('dental-insurance.yes.alert-title')}</h3>
                <p>{t('dental-insurance.yes.alert-body')}</p>
              </ContextualAlert>
              <InputCheckbox
                id="dental-insurance-eligibility-confirmation-yes"
                name="dentalInsuranceEligibilityConfirmationYes"
                value={CHECKBOX_VALUE.yes}
                defaultChecked={defaultState?.dentalInsuranceEligibilityConfirmationYes}
                errorMessage={errors?.dentalInsuranceEligibilityConfirmationYes}
                required
              >
                {t('dental-insurance.yes.confirmation')}
              </InputCheckbox>
            </div>
          )}
          {hasDentalInsurance === false && (
            <div className="mb-4 space-y-4">
              <ContextualAlert type="info">
                <h3 className="font-lato mb-2 text-xl font-semibold">{t('dental-insurance.no.alert-title')}</h3>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:dental-insurance.no.alert-body" components={{ t4Href, t4aHref }} />
              </ContextualAlert>
              <InputCheckbox
                id="dental-insurance-eligibility-confirmation-no"
                name="dentalInsuranceEligibilityConfirmationNo"
                value={CHECKBOX_VALUE.yes}
                defaultChecked={defaultState?.dentalInsuranceEligibilityConfirmationNo}
                errorMessage={errors?.dentalInsuranceEligibilityConfirmationNo}
                required
              >
                {t('dental-insurance.no.confirmation')}
              </InputCheckbox>
            </div>
          )}

          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Save - Access to other dental insurance click">
              {t('dental-insurance.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`protected/application/$id/${applicationFlow}/dental-insurance`}
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Back - Access to other dental insurance click"
            >
              {t('dental-insurance.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </ErrorSummaryProvider>
  );
}
