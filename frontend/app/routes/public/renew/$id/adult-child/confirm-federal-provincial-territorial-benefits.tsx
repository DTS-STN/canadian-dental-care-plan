import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { loadRenewAdultChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import type { ConfirmDentalBenefitsState } from '~/.server/routes/helpers/renew-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum FederalBenefitsChangedOption {
  No = 'no',
  Yes = 'yes',
}

enum ProvincialTerritorialBenefitsChangedOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmFederalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'renew-adult-child:confirm-dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm-dental-benefits.title') }) };

  return {
    csrfToken,
    defaultState: state.confirmDentalBenefits,
    editMode: state.editMode,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/adult-child/confirm-federal-provincial-territorial');
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // NOTE: state validation schemas are independent otherwise user have to anwser
  // both question first before the superRefine can be executed
  const dentalBenefitsChangedSchema = z.object({
    federalBenefitsChanged: z.boolean({ errorMap: () => ({ message: t('renew-adult-child:confirm-dental-benefits.error-message.federal-benefit-required') }) }),
    provincialTerritorialBenefitsChanged: z.boolean({ errorMap: () => ({ message: t('renew-adult-child:confirm-dental-benefits.error-message.provincial-benefit-required') }) }),
  }) satisfies z.ZodType<ConfirmDentalBenefitsState>;

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const dentalBenefits = {
    federalBenefitsChanged: formData.get('federalBenefitsChanged') ? formData.get('federalBenefitsChanged') === FederalBenefitsChangedOption.Yes : undefined,
    provincialTerritorialBenefitsChanged: formData.get('provincialTerritorialBenefitsChanged') ? formData.get('provincialTerritorialBenefitsChanged') === ProvincialTerritorialBenefitsChangedOption.Yes : undefined,
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
      confirmDentalBenefits: {
        ...parsedDentalBenefitsResult.data,
      },
      dentalBenefits: parsedDentalBenefitsResult.data.federalBenefitsChanged || parsedDentalBenefitsResult.data.provincialTerritorialBenefitsChanged ? state.dentalBenefits : undefined,
    },
  });

  if (dentalBenefits.federalBenefitsChanged || dentalBenefits.provincialTerritorialBenefitsChanged) {
    return redirect(getPathById('public/renew/$id/adult-child/update-federal-provincial-territorial-benefits', params));
  }

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/children/index', params));
}

export default function RenewAdultChildConfirmFederalProvincialTerritorialBenefits() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [federalBenefitChangedValue, setFederalBenefitChangedValue] = useState(defaultState?.federalBenefitsChanged);
  const [provincialTerritorialBenefitChangedValue, setProvincialTerritorialBenefitChangedValue] = useState(defaultState?.provincialTerritorialBenefitsChanged);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    federalBenefitsChanged: 'input-radio-federal-benefits-changed-option-0',
    provincialTerritorialBenefitsChanged: 'input-radio-provincial-territorial-benefits-changed-option-0',
  });

  function handleOnFederalBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setFederalBenefitChangedValue(e.target.value === FederalBenefitsChangedOption.Yes);
  }

  function handleOnProvincialTerritorialBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setProvincialTerritorialBenefitChangedValue(e.target.value === ProvincialTerritorialBenefitsChangedOption.Yes);
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={88} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4">{t('renew-adult-child:confirm-dental-benefits.access-to-dental')}</p>
        <p className="mb-4">{t('renew-adult-child:confirm-dental-benefits.eligibility-criteria')}</p>
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-adult-child:confirm-dental-benefits.federal-benefits.title')}</legend>
            <InputRadios
              id="federal-benefits-changed"
              name="federalBenefitsChanged"
              legend={t('renew-adult-child:confirm-dental-benefits.federal-benefits.legend')}
              helpMessagePrimary={t('renew-adult-child:confirm-dental-benefits.federal-benefits.help-message')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:confirm-dental-benefits.federal-benefits.option-yes" />,
                  value: FederalBenefitsChangedOption.Yes,
                  defaultChecked: federalBenefitChangedValue === true,
                  onChange: handleOnFederalBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:confirm-dental-benefits.federal-benefits.option-no" />,
                  value: FederalBenefitsChangedOption.No,
                  defaultChecked: federalBenefitChangedValue === false,
                  onChange: handleOnFederalBenefitChanged,
                },
              ]}
              errorMessage={errors?.federalBenefitsChanged}
              required
            />
          </fieldset>
          <fieldset className="mb-8">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-adult-child:confirm-dental-benefits.provincial-territorial-benefits.title')}</legend>
            <InputRadios
              id="provincial-territorial-benefits-changed"
              name="provincialTerritorialBenefitsChanged"
              legend={t('renew-adult-child:confirm-dental-benefits.provincial-territorial-benefits.legend')}
              helpMessagePrimary={t('renew-adult-child:confirm-dental-benefits.provincial-territorial-benefits.help-message')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:confirm-dental-benefits.provincial-territorial-benefits.option-yes" />,
                  value: ProvincialTerritorialBenefitsChangedOption.Yes,
                  defaultChecked: provincialTerritorialBenefitChangedValue === true,
                  onChange: handleOnProvincialTerritorialBenefitChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="renew-adult-child:confirm-dental-benefits.provincial-territorial-benefits.option-no" />,
                  value: ProvincialTerritorialBenefitsChangedOption.No,
                  defaultChecked: provincialTerritorialBenefitChangedValue === false,
                  onChange: handleOnProvincialTerritorialBenefitChanged,
                },
              ]}
              errorMessage={errors?.provincialTerritorialBenefitsChanged}
              required
            />
          </fieldset>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Access to other dental benefits click">
                {t('renew-adult-child:confirm-dental-benefits.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Access to other dental benefits click"
              >
                {t('renew-adult-child:confirm-dental-benefits.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Access to other dental benefits click">
                {t('renew-adult-child:confirm-dental-benefits.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/dental-insurance"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Access to other dental benefits click"
              >
                {t('renew-adult-child:confirm-dental-benefits.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
