import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import { clearRenewState, loadRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.fileYourTaxes,
  pageTitleI18nKey: 'renew:file-your-taxes.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const { id } = loadRenewState({ params, session });

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:file-your-taxes.page-title') }) };

  return { id, csrfToken, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/file-taxes');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  clearRenewState({ params, session });
  return redirect(t('renew:file-your-taxes.return-btn-link'));
}

export default function RenewFileYourTaxes() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const taxInfo = <InlineLink to={t('renew:file-your-taxes.tax-info-href')} className="external-link" newTabIndicator target="_blank" />;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('renew.state');
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('renew:file-your-taxes.ineligible-to-renew')}</p>
        <p>{t('renew:file-your-taxes.tax-not-filed')}</p>
        <p>{t('renew:file-your-taxes.unable-to-assess')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="renew:file-your-taxes.tax-info" components={{ taxInfo }} />
        </p>
        <p>{t('renew:file-your-taxes.renew-after')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink id="back-button" routeId="public/renew/$id/tax-filing" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Back - File your taxes click">
          {t('renew:file-your-taxes.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Exit - File your taxes click">
          {t('renew:file-your-taxes.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
