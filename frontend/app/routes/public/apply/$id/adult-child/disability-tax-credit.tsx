import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { getAgeCategoryFromDateString, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum DisabilityTaxCreditOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.disabilityTaxCredit,
  pageTitleI18nKey: 'apply-adult-child:disability-tax-credit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:disability-tax-credit.page-title') }) };

  invariant(state.dateOfBirth, 'Expected state.dateOfBirth to be defined');
  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  if (ageCategory !== 'adults') {
    return redirect(getPathById('public/apply/$id/adult-child/date-of-birth', params));
  }

  return json({ id: state.id, csrfToken, meta, defaultState: state.disabilityTaxCredit, editMode: state.editMode });
}

export async function action({ context: { appContainer, serviceProvider, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/disability-tax-credit');
  const state = loadApplyAdultChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const disabilityTaxCreditSchema = z.object({
    disabilityTaxCredit: z.nativeEnum(DisabilityTaxCreditOption, {
      errorMap: () => ({ message: t('apply-adult-child:disability-tax-credit.error-message.disability-tax-credit-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { disabilityTaxCredit: formData.get('disabilityTaxCredit') };
  const parsedDataResult = disabilityTaxCreditSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  saveApplyState({ params, session, state: { disabilityTaxCredit: parsedDataResult.data.disabilityTaxCredit === DisabilityTaxCreditOption.Yes } });

  invariant(state.dateOfBirth, 'Expected state.dateOfBirth to be defined');
  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  if (ageCategory !== 'adults') {
    return redirect(getPathById('public/apply/$id/adult-child/date-of-birth', params));
  }

  if (parsedDataResult.data.disabilityTaxCredit === DisabilityTaxCreditOption.No && state.allChildrenUnder18) {
    return redirect(getPathById('public/apply/$id/adult-child/apply-children', params));
  }

  if (parsedDataResult.data.disabilityTaxCredit === DisabilityTaxCreditOption.No && !state.allChildrenUnder18) {
    return redirect(getPathById('public/apply/$id/adult-child/dob-eligibility', params));
  }

  if (parsedDataResult.data.disabilityTaxCredit === DisabilityTaxCreditOption.No) {
    return redirect(getPathById('public/apply/$id/adult-child/parent-or-guardian', params));
  }

  if (!state.allChildrenUnder18) {
    return redirect(getPathById('public/apply/$id/adult-child/apply-yourself', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/applicant-information', params));
}

export default function ApplyFlowDisabilityTaxCredit() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    disabilityTaxCredit: 'input-radio-disability-tax-credit-radios-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={30} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-5">{t('apply-adult-child:disability-tax-credit.non-refundable')}</p>
        <p className="mb-5">
          <Trans
            ns={handle.i18nNamespaces}
            i18nKey="apply-adult-child:disability-tax-credit.more-info"
            components={{ dtcLink: <InlineLink to={t('apply-adult-child:disability-tax-credit.dtc-link')} className="external-link" newTabIndicator target="_blank" /> }}
          />
        </p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="disability-tax-credit-radios"
            name="disabilityTaxCredit"
            legend={t('apply-adult-child:disability-tax-credit.form-label')}
            options={[
              { value: DisabilityTaxCreditOption.Yes, children: t('apply-adult-child:disability-tax-credit.radio-options.yes'), defaultChecked: defaultState === true },
              { value: DisabilityTaxCreditOption.No, children: t('apply-adult-child:disability-tax-credit.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.disabilityTaxCredit}
            required
          />
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Save - Disability tax credit click">
                {t('apply-adult-child:disability-tax-credit.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Cancel - Disability tax credit click"
              >
                {t('apply-adult-child:disability-tax-credit.back-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Continue - Disability tax credit click">
                {t('apply-adult-child:disability-tax-credit.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/date-of-birth"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult-Child:Back - Disability tax credit click"
              >
                {t('apply-adult-child:disability-tax-credit.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
