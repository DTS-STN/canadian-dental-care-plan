import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyAdultState } from '~/.server/routes/helpers/protected-apply-adult-route-helpers';
import { saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-adult', 'protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.adult.confirmFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'protected-apply-adult:confirm-dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-adult:confirm-dental-benefits.title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.adult.confirm-federal-provincial-territorial-benefits', { userId: idToken.sub });

  return {
    defaultState: state.hasFederalProvincialTerritorialBenefits,
    editMode: state.editMode,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const state = loadProtectedApplyAdultState({ params, request, session });

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const dentalBenefitsChangedSchema = z.object({
    hasFederalProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('protected-apply-adult:confirm-dental-benefits.error-message.federal-provincial-territorial-benefit-required') }) }),
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

  saveProtectedApplyState({
    params,
    session,
    state: {
      hasFederalProvincialTerritorialBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits,
      dentalBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits ? state.dentalBenefits : undefined,
    },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.adult.confirm-federal-provincial-territorial-benefits', { userId: idToken.sub });

  if (dentalBenefits.hasFederalProvincialTerritorialBenefits) {
    return redirect(getPathById('protected/apply/$id/adult/federal-provincial-territorial-benefits', params));
  }

  return redirect(getPathById('protected/apply/$id/adult/review-information', params));
}

export default function ProtectedApplyAdultConfirmFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
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
        <Progress value={90} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('protected-apply-adult:confirm-dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('protected-apply-adult:confirm-dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('protected-apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <InputRadios
              id="federal-provincial-territorial-benefits-changed"
              name="hasFederalProvincialTerritorialBenefits"
              legend={t('protected-apply-adult:confirm-dental-benefits.has-benefits')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-adult:confirm-dental-benefits.option-yes" />,
                  value: FEDERAL_BENEFITS_CHANGED_OPTION.yes,
                  defaultChecked: federalProvincialTerritorialBenefitChangedValue === true,
                  onChange: handleOnFederalProvincialTerritorialBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-adult:confirm-dental-benefits.option-no" />,
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
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult:Save - Access to other government dental benefits click">
                {t('protected-apply-adult:confirm-dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="protected/apply/$id/adult/review-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult:Cancel - Access to other government dental benefits click"
              >
                {t('protected-apply-adult:confirm-dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                variant="primary"
                id="continue-button"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult:Continue - Access to other government dental benefits click"
              >
                {t('protected-apply-adult:confirm-dental-benefits.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/apply/$id/adult/dental-insurance"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Adult:Back - Access to other government dental benefits click"
              >
                {t('protected-apply-adult:confirm-dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
