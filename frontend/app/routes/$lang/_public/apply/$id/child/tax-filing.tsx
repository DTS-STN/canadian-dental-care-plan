import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadApplyChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum TaxFilingOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.taxFiling,
  pageTitleI18nKey: 'apply-child:eligibility.tax-filing.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:eligibility.tax-filing.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.taxFiling2023 });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/child/tax-filing');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema = z.object({
    taxFiling2023: z.nativeEnum(TaxFilingOption, {
      errorMap: () => ({ message: t('apply-child:eligibility.tax-filing.error-message.tax-filing-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { taxFiling2023: formData.get('taxFiling2023') };
  const parsedDataResult = taxFilingSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  saveApplyState({ params, session, state: { taxFiling2023: parsedDataResult.data.taxFiling2023 === TaxFilingOption.Yes } });

  if (parsedDataResult.data.taxFiling2023 === TaxFilingOption.No) {
    return redirect(getPathById('$lang/_public/apply/$id/child/file-taxes', params));
  }

  return redirect(getPathById('$lang/_public/apply/$id/child/children/index', params));
}

export default function ApplyFlowTaxFiling() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { taxFiling2023: 'input-radio-tax-filing-2023-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={25} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="tax-filing-2023"
            name="taxFiling2023"
            legend={t('apply-child:eligibility.tax-filing.form-instructions')}
            options={[
              { value: TaxFilingOption.Yes, children: t('apply-child:eligibility.tax-filing.radio-options.yes'), defaultChecked: defaultState === true },
              { value: TaxFilingOption.No, children: t('apply-child:eligibility.tax-filing.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.taxFiling2023}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Tax filing click">
              {t('apply-child:eligibility.tax-filing.continue-btn')}
            </LoadingButton>
            <ButtonLink id="back-button" routeId="$lang/_public/apply/$id/type-application" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Tax filing click">
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply-child:eligibility.tax-filing.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
