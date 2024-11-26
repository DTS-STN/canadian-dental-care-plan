import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum TaxFilingOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.taxFiling,
  pageTitleI18nKey: 'renew:tax-filing.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:tax-filing.page-title') }) };

  return { id: state.id, meta, defaultState: state.taxFiling };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema = z.object({
    taxFiling: z.nativeEnum(TaxFilingOption, {
      errorMap: () => ({ message: t('renew:tax-filing.error-message.tax-filing-required') }),
    }),
  });

  const parsedDataResult = taxFilingSchema.safeParse({ taxFiling: formData.get('taxFiling') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({ params, session, state: { taxFiling: parsedDataResult.data.taxFiling === TaxFilingOption.Yes } });

  if (parsedDataResult.data.taxFiling === TaxFilingOption.No) {
    return redirect(getPathById('public/renew/$id/file-taxes', params));
  }

  return redirect(getPathById('public/renew/$id/type-renewal', params));
}

export default function RenewFlowTaxFiling() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { taxFiling: 'input-radio-tax-filing-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={22} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="tax-filing"
            name="taxFiling"
            legend={t('renew:tax-filing.form-instructions')}
            options={[
              { value: TaxFilingOption.Yes, children: t('renew:tax-filing.radio-options.yes'), defaultChecked: defaultState === true },
              { value: TaxFilingOption.No, children: t('renew:tax-filing.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.taxFiling}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Renew:Continue - Tax filing click">
              {t('renew:tax-filing.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="public/renew/$id/applicant-information"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Renew:Back - Tax filing click"
            >
              {t('renew:tax-filing.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
