import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadRenewState, saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum HasAddressChangedOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.confirmAddress,
  pageTitleI18nKey: 'renew-ita:confirm-address.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:confirm-address.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.hasAddressChanged });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/ita/confirm-address');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const hasAddressChangedSchema = z.object({
    hasAddressChanged: z.nativeEnum(HasAddressChangedOption, {
      errorMap: () => ({ message: t('renew-ita:confirm-address.error-message.has-address-changed-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { hasAddressChanged: formData.get('hasAddressChanged') };
  const parsedDataResult = hasAddressChangedSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
  }

  saveRenewState({ params, session, state: { hasAddressChanged: parsedDataResult.data.hasAddressChanged === HasAddressChangedOption.Yes } });

  if (parsedDataResult.data.hasAddressChanged === HasAddressChangedOption.No) {
    return redirect(getPathById('public/apply/$id/ita/dental-insurance', params));
  }

  return redirect(getPathById('public/apply/$id/ita/update-address', params));
}

export default function RenewItaConfirmAddress() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { hasAddressChanged: 'input-radio-has-address-changed-option-0' });

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
          <InputRadios
            id="has-address-changed"
            name="hasAddressChanged"
            legend={t('renew-ita:confirm-address.form-instructions')}
            options={[
              { value: HasAddressChangedOption.Yes, children: t('renew-ita:confirm-address.radio-options.yes'), defaultChecked: defaultState === true },
              { value: HasAddressChangedOption.No, children: t('renew-ita:confirm-address.radio-options.no'), defaultChecked: defaultState === false },
            ]}
            helpMessagePrimary={t('renew-ita:confirm-address.help-message')}
            errorMessage={errors?.hasAddressChanged}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Confirm address click">
              {t('renew-ita:confirm-address.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="public/renew/$id/ita/marital-status"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Confirm address click"
            >
              {t('renew-ita:confirm-address.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}