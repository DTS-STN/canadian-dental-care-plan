import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.taxFiling,
  pageTitleI18nKey: 'protected-renew:tax-filing.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:tax-filing.page-title') }) };

  return { id: state.id, csrfToken, meta, defaultState: state.taxFiling };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('protected/renew/tax-filing');

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const taxFilingSchema = z.object({
    taxFiling: z.nativeEnum(TaxFilingOption, {
      errorMap: () => ({ message: t('protected-renew:tax-filing.error-message.tax-filing-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw data('Invalid CSRF token', { status: 400 });
  }

  const parsedDataResult = taxFilingSchema.safeParse({
    taxFiling: formData.get('taxFiling'),
  });

  if (!parsedDataResult.success) {
    return data(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({ params, session, state: { taxFiling: parsedDataResult.data.taxFiling === TaxFilingOption.Yes } });

  if (parsedDataResult.data.taxFiling === TaxFilingOption.No) {
    return redirect(getPathById('protected/renew/$id/file-taxes', params));
  }

  return redirect(getPathById('protected/renew/$id/member-selection', params));
}

export default function ProtectedRenewFlowTaxFiling() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { taxFiling: 'input-radio-tax-filing-option-0' });

  return (
    <>
      <div className="max-w-prose">
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="tax-filing"
            name="taxFiling"
            legend={t('protected-renew:tax-filing.form-instructions')}
            options={[
              { value: TaxFilingOption.Yes, children: t('protected-renew:tax-filing.radio-options.yes'), defaultChecked: defaultState === true },
              { value: TaxFilingOption.No, children: t('protected-renew:tax-filing.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            errorMessage={errors?.taxFiling}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-protected-Renew:Continue - Tax filing click">
              {t('protected-renew:tax-filing.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="protected/renew/$id/terms-and-conditions"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-protected-Renew:Back - Tax filing click"
            >
              {t('protected-renew:tax-filing.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
