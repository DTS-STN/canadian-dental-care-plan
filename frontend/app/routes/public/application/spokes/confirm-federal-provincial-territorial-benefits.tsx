import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FEDERAL_BENEFITS_CHANGED_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-spokes', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.confirmFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'application-spokes:confirm-dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-adult', 'new-children', 'new-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:confirm-dental-benefits.title') }) };

  return {
    defaultState: state.hasFederalProvincialTerritorialBenefits,
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

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const dentalBenefitsChangedSchema = z.object({
    hasFederalProvincialTerritorialBenefits: z.boolean({ error: t('application-spokes:confirm-dental-benefits.error-message.federal-provincial-territorial-benefit-required') }),
  });

  const dentalBenefits = {
    hasFederalProvincialTerritorialBenefits: formData.get('hasFederalProvincialTerritorialBenefits') ? formData.get('hasFederalProvincialTerritorialBenefits') === FEDERAL_BENEFITS_CHANGED_OPTION.yes : undefined,
  };

  const parsedDentalBenefitsResult = dentalBenefitsChangedSchema.safeParse(dentalBenefits);

  if (!parsedDentalBenefitsResult.success) {
    return data(
      {
        errors: {
          ...transformFlattenedError(z.flattenError(parsedDentalBenefitsResult.error)),
        },
      },
      { status: 400 },
    );
  }

  savePublicApplicationState({
    params,
    session,
    state: {
      hasFederalProvincialTerritorialBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits,
      dentalBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits ? state.dentalBenefits : undefined,
    },
  });

  if (dentalBenefits.hasFederalProvincialTerritorialBenefits) {
    return redirect(getPathById('public/application/$id/federal-provincial-territorial-benefits', params));
  }

  return redirect(getPathById(`public/application/$id/${state.typeOfApplication}-${state.typeOfApplicationFlow}/dental-insurance`, params));
}

export default function ApplicationSpokeConfirmFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, typeAndFlow } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [federalProvincialTerritorialBenefitChangedValue, setFederalProvincialTerrirorialBenefitChangedValue] = useState(defaultState);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasFederalProvincialTerritorialBenefits: 'input-radio-federal-provincial-territorial-benefits-changed-option-0',
  });

  function handleOnFederalProvincialTerritorialBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setFederalProvincialTerrirorialBenefitChangedValue(e.target.value === FEDERAL_BENEFITS_CHANGED_OPTION.yes);
  }

  return (
    <div className="max-w-prose">
      <p className="mb-4">{t('application-spokes:confirm-dental-benefits.access-to-dental')}</p>
      <p className="mb-4">{t('application-spokes:confirm-dental-benefits.eligibility-criteria')}</p>
      <p className="mb-4 italic">{t('application:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <fieldset className="mb-6">
          <InputRadios
            id="federal-provincial-territorial-benefits-changed"
            name="hasFederalProvincialTerritorialBenefits"
            legend={t('application-spokes:confirm-dental-benefits.has-benefits')}
            options={[
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:confirm-dental-benefits.option-yes" />,
                value: FEDERAL_BENEFITS_CHANGED_OPTION.yes,
                defaultChecked: federalProvincialTerritorialBenefitChangedValue === true,
                onChange: handleOnFederalProvincialTerritorialBenefitChanged,
              },
              {
                children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:confirm-dental-benefits.option-no" />,
                value: FEDERAL_BENEFITS_CHANGED_OPTION.no,
                defaultChecked: federalProvincialTerritorialBenefitChangedValue === false,
                onChange: handleOnFederalProvincialTerritorialBenefitChanged,
              },
            ]}
            errorMessage={errors?.hasFederalProvincialTerritorialBenefits}
            required
          />
        </fieldset>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Access to other government dental benefits click">
            {t('application-spokes:confirm-dental-benefits.button.continue')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId={`public/application/$id/${typeAndFlow}/dental-insurance`}
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Access to other government dental benefits click"
          >
            {t('application-spokes:confirm-dental-benefits.button.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
