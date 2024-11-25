import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
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

enum MaritalStatusRadioOptions {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.confirmMaritalStatus,
  pageTitleI18nKey: 'renew-adult-child:confirm-marital-status.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-adult-child:confirm-marital-status.page-title') }) };

  return { id: state.id, csrfToken, meta, defaultState: state.hasMaritalStatusChanged, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewAdultChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const confirmMaritalStatusSchema = z.object({
    hasMaritalStatusChanged: z.boolean({
      errorMap: () => ({ message: t('renew-adult-child:confirm-marital-status.error-message.has-marital-status-changed-required') }),
    }),
  });

  const parsedDataResult = confirmMaritalStatusSchema.safeParse({
    hasMaritalStatusChanged: formData.get('hasMaritalStatusChanged') ? formData.get('hasMaritalStatusChanged') === 'yes' : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      hasMaritalStatusChanged: parsedDataResult.data.hasMaritalStatusChanged,
      maritalStatus: undefined,
    },
  });

  if (state.editMode) {
    if (parsedDataResult.data.hasMaritalStatusChanged) {
      return redirect(getPathById('public/renew/$id/adult-child/marital-status', params));
    }
    return redirect(getPathById('public/renew/$id/adult-child/review-adult-information', params));
  }

  if (parsedDataResult.data.hasMaritalStatusChanged) {
    return redirect(getPathById('public/renew/$id/adult-child/marital-status', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/confirm-phone', params));
}

export default function RenewAdultChildConfirmMaritalStatus() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    hasMaritalStatusChanged: 'input-radio-has-marital-status-changed-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={22} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-6">
            <InputRadios
              id="has-marital-status-changed"
              name="hasMaritalStatusChanged"
              legend={t('renew-adult-child:confirm-marital-status.has-marital-status-changed')}
              options={[
                { value: MaritalStatusRadioOptions.Yes, children: t('renew-adult-child:confirm-marital-status.radio-options.yes'), defaultChecked: defaultState === true },
                { value: MaritalStatusRadioOptions.No, children: t('renew-adult-child:confirm-marital-status.radio-options.no'), defaultChecked: defaultState === false },
              ]}
              helpMessagePrimary={t('renew-adult-child:confirm-marital-status.help-message')}
              errorMessage={errors?.hasMaritalStatusChanged}
              required
            />
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button name="_action" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Confirm marital status click">
                {t('renew-adult-child:marital-status.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Confirm marital status click"
              >
                {t('dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Confirm marital status click">
                {t('renew-adult-child:confirm-marital-status.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/type-renewal"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Confirm marital status click"
              >
                {t('renew-adult-child:confirm-marital-status.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
