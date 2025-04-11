import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/confirm-federal-provincial-territorial-benefits';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyChildState, loadProtectedApplySingleChildState } from '~/.server/routes/helpers/protected-apply-child-route-helpers';
import { saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.child.childConfirmFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'protected-apply-child:children.confirm-dental-benefits.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const state = loadProtectedApplySingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('protected-apply-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('protected-apply-child:children.confirm-dental-benefits.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('protected-apply-child:children.confirm-dental-benefits.title', { childName: childNumber }) }),
  };

  instrumentationService.countHttpStatus('protected.apply.child.children.confirm-federal-provincial-territorial-benefits', 200);

  return {
    defaultState: state.hasFederalProvincialTerritorialBenefits,
    editMode: state.editMode,
    meta,
    childName,
    i18nOptions: { childName },
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedApplySingleChildState({ params, request, session });
  const applyState = loadProtectedApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const dentalBenefitsChangedSchema = z.object({
    hasFederalProvincialTerritorialBenefits: z.boolean({ errorMap: () => ({ message: t('protected-apply-child:children.confirm-dental-benefits.error-message.federal-provincial-territorial-benefit-required') }) }),
  });

  const dentalBenefits = {
    hasFederalProvincialTerritorialBenefits: formData.get('hasFederalProvincialTerritorialBenefits') ? formData.get('hasFederalProvincialTerritorialBenefits') === FEDERAL_BENEFITS_CHANGED_OPTION.yes : undefined,
  };

  const parsedDentalBenefitsResult = dentalBenefitsChangedSchema.safeParse(dentalBenefits);

  if (!parsedDentalBenefitsResult.success) {
    instrumentationService.countHttpStatus('protected.apply.child.children.confirm-federal-provincial-territorial-benefits', 400);
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
      children: applyState.children.map((child) => {
        if (child.id !== state.id) return child;
        return {
          ...child,
          hasFederalProvincialTerritorialBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits,
          dentalBenefits: parsedDentalBenefitsResult.data.hasFederalProvincialTerritorialBenefits ? state.dentalBenefits : undefined,
        };
      }),
    },
  });

  instrumentationService.countHttpStatus('protected.apply.child.children.confirm-federal-provincial-territorial-benefits', 302);

  if (dentalBenefits.hasFederalProvincialTerritorialBenefits === true) {
    return redirect(getPathById('protected/apply/$id/child/children/$childId/federal-provincial-territorial-benefits', params));
  }

  if (state.editMode) {
    return redirect(getPathById('protected/apply/$id/child/review-child-information', params));
  }

  return redirect(getPathById('protected/apply/$id/child/children/index', params));
}

export default function ApplyAdultChildConfirmFederalProvincialTerritorialBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { childName, defaultState, editMode } = loaderData;

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
        <Progress value={30} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('protected-apply-child:children.confirm-dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('protected-apply-child:children.confirm-dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <fieldset className="mb-6">
            <InputRadios
              id="federal-provincial-territorial-benefits-changed"
              name="hasFederalProvincialTerritorialBenefits"
              legend={t('protected-apply-child:children.confirm-dental-benefits.has-benefits', { childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-child:children.confirm-dental-benefits.option-yes" />,
                  value: FEDERAL_BENEFITS_CHANGED_OPTION.yes,
                  defaultChecked: federalProvincialTerritorialBenefitChangedValue === true,
                  onChange: handleOnFederalProvincialTerritorialBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-child:children.confirm-dental-benefits.option-no" />,
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
              <Button id="save-button" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Child access to other government dental benefits click">
                {t('protected-apply-child:children.confirm-dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="protected/apply/$id/child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Child access to other government dental benefits click"
              >
                {t('protected-apply-child:children.confirm-dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                variant="primary"
                id="continue-button"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Child access to other government dental benefits click"
              >
                {t('protected-apply-child:children.confirm-dental-benefits.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/apply/$id/child/children/$childId/dental-insurance"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child access to other government dental benefits click"
              >
                {t('protected-apply-child:children.confirm-dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
