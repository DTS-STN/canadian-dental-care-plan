import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
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

const FEDERAL_BENEFITS_CHANGED_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.confirmFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'apply-adult-child:confirm-dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:confirm-dental-benefits.title') }) };

  return {
    defaultState: state.hasFederalProvincialTerritorialBenefits,
    editMode: state.editMode,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const dentalBenefitsChangedSchema = z.object({
    hasFederalProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('apply-adult-child:confirm-dental-benefits.error-message.federal-provincial-territorial-benefit-required') }) }),
  });

  const dentalBenefits = {
    hasFederalProvincialTerritorialBenefits: formData.get('hasFederalProvincialTerritorialBenefits') ? formData.get('hasFederalProvincialTerritorialBenefits') === FEDERAL_BENEFITS_CHANGED_OPTION.yes : undefined,
  };

  const parsedDentalBenefitsResult = dentalBenefitsChangedSchema.safeParse(dentalBenefits);

  if (!parsedDentalBenefitsResult.success) {
    return data(
      {
        errors: {
          ...transformFlattenedError(parsedDentalBenefitsResult.error.flatten()),
        },
      },
      { status: 400 },
    );
  }

  saveApplyState({
    params,
    session,
    state: {
      hasFederalProvincialTerritorialBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits,
      dentalBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits ? state.dentalBenefits : undefined,
    },
  });

  if (dentalBenefits.hasFederalProvincialTerritorialBenefits) {
    return redirect(getPathById('public/apply/$id/adult-child/federal-provincial-territorial-benefits', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/children/index', params));
}

export default function ApplyAdultChildConfirmFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

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
    <>
      <div className="my-6 sm:my-8">
        <Progress value={76} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('apply-adult-child:confirm-dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('apply-adult-child:confirm-dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <InputRadios
              id="federal-provincial-territorial-benefits-changed"
              name="hasFederalProvincialTerritorialBenefits"
              legend={t('apply-adult-child:confirm-dental-benefits.has-benefits')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:confirm-dental-benefits.option-yes" />,
                  value: FEDERAL_BENEFITS_CHANGED_OPTION.yes,
                  defaultChecked: federalProvincialTerritorialBenefitChangedValue === true,
                  onChange: handleOnFederalProvincialTerritorialBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult-child:confirm-dental-benefits.option-no" />,
                  value: FEDERAL_BENEFITS_CHANGED_OPTION.no,
                  defaultChecked: federalProvincialTerritorialBenefitChangedValue === false,
                  onChange: handleOnFederalProvincialTerritorialBenefitChanged,
                },
              ]}
              errorMessage={errors?.hasFederalProvincialTerritorialBenefits}
              required
            />
          </fieldset>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Access to other government dental benefits click">
                {t('apply-adult-child:confirm-dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="public/apply/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Access to other government dental benefits click"
              >
                {t('apply-adult-child:confirm-dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                variant="primary"
                id="continue-button"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Access to other government dental benefits click"
              >
                {t('apply-adult-child:confirm-dental-benefits.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/dental-insurance"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Access to other government dental benefits click"
              >
                {t('apply-adult-child:confirm-dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
