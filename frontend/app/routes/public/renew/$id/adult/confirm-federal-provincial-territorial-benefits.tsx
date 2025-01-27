import { useState } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultState } from '~/.server/routes/helpers/renew-adult-route-helpers';
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
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FederalBenefitsChangedOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adult.confirmFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'renew-adult:confirm-dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult:confirm-dental-benefits.title') }) };

  return {
    defaultState: state.hasFederalProvincialTerritorialBenefitsChanged,
    editMode: state.editMode,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const dentalBenefitsChangedSchema = z.object({
    hasFederalProvincialTerritorialBenefitsChanged: z.boolean({ errorMap: () => ({ message: t('renew-adult:confirm-dental-benefits.error-message.federal-provincial-territorial-benefit-required') }) }),
  });

  const dentalBenefits = {
    hasFederalProvincialTerritorialBenefitsChanged: formData.get('hasFederalProvincialTerritorialBenefitsChanged') ? formData.get('hasFederalProvincialTerritorialBenefitsChanged') === FederalBenefitsChangedOption.Yes : undefined,
  };

  const parsedDentalBenefitsResult = dentalBenefitsChangedSchema.safeParse(dentalBenefits);

  if (!parsedDentalBenefitsResult.success) {
    return {
      errors: {
        ...transformFlattenedError(parsedDentalBenefitsResult.error.flatten()),
      },
    };
  }

  saveRenewState({
    params,
    session,
    state: {
      hasFederalProvincialTerritorialBenefitsChanged: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefitsChanged,
      dentalBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefitsChanged ? state.dentalBenefits : undefined,
    },
  });

  if (dentalBenefits.hasFederalProvincialTerritorialBenefitsChanged) {
    return redirect(getPathById('public/renew/$id/adult/update-federal-provincial-territorial-benefits', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult/review-adult-information', params));
  }

  if (demographicSurveyEnabled) {
    return redirect(getPathById('public/renew/$id/adult/demographic-survey', params));
  }

  return redirect(getPathById('public/renew/$id/adult/review-adult-information', params));
}

export default function RenewAdultConfirmFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [federalProvincialTerritorialBenefitChangedValue, setFederalProvincialTerrirorialBenefitChangedValue] = useState(defaultState);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasFederalProvincialTerritorialBenefitsChanged: 'input-radio-federal-provincial-territorial-benefits-changed-option-0',
  });

  function handleOnFederalProvincialTerritorialBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setFederalProvincialTerrirorialBenefitChangedValue(e.target.value === FederalBenefitsChangedOption.Yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={88} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('renew-adult:confirm-dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('renew-adult:confirm-dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <InputRadios
              id="federal-provincial-territorial-benefits-changed"
              name="hasFederalProvincialTerritorialBenefitsChanged"
              legend={t('renew-adult:confirm-dental-benefits.has-benefits')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult:confirm-dental-benefits.option-yes" />,
                  value: FederalBenefitsChangedOption.Yes,
                  defaultChecked: federalProvincialTerritorialBenefitChangedValue === true,
                  onChange: handleOnFederalProvincialTerritorialBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult:confirm-dental-benefits.option-no" />,
                  value: FederalBenefitsChangedOption.No,
                  defaultChecked: federalProvincialTerritorialBenefitChangedValue === false,
                  onChange: handleOnFederalProvincialTerritorialBenefitChanged,
                },
              ]}
              errorMessage={errors?.hasFederalProvincialTerritorialBenefitsChanged}
              required
            />
          </fieldset>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Access to other federal, provincial or territorial dental benefits click">
                {t('renew-adult:confirm-dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="public/renew/$id/adult/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Access to other federal, provincial or territorial dental benefits click"
              >
                {t('renew-adult:confirm-dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                variant="primary"
                id="continue-button"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Access to other federal, provincial or territorial dental benefits click"
              >
                {t('renew-adult:confirm-dental-benefits.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult/dental-insurance"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Access to other federal, provincial or territorial dental benefits click"
              >
                {t('renew-adult:confirm-dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
