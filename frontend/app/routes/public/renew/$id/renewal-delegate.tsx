import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useParams } from '@remix-run/react';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { clearRenewState, loadRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.renewalDelegate,
  pageTitleI18nKey: 'renew:renewal-delegate.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const { id } = loadRenewState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:renewal-delegate.page-title') }) };

  return { id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearRenewState({ params, session });

  return redirect(t('renew:renewal-delegate.return-btn-link'));
}

export default function RenewalDelegate() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const contactServiceCanada = <InlineLink to={t('renew:renewal-delegate.contact-service-canada-href')} className="external-link" newTabIndicator target="_blank" />;
  const preparingToRenew = <InlineLink to={t('renew:renewal-delegate.preparing-to-apply-href')} className="external-link" newTabIndicator target="_blank" />;
  const noWrap = <span className="whitespace-nowrap" />;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('renew.state');
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="renew:renewal-delegate.contact-representative" components={{ contactServiceCanada, noWrap }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="renew:renewal-delegate.prepare-to-apply" components={{ preparingToRenew }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink type="button" routeId="public/renew/$id/type-renewal" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renewal Application Form:Back - Renewing on behalf of someone click">
          {t('renew:renewal-delegate.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renewal Application Form:Exit - Renewing on behalf of someone click">
          {t('renew:renewal-delegate.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
