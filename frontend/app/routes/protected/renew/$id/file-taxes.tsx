import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { clearProtectedRenewState, loadProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.fileYourTaxes,
  pageTitleI18nKey: 'protected-renew:file-your-taxes.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const { id } = loadProtectedRenewState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:file-your-taxes.page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.configs.ClientConfig);

  return { id, meta, SCCH_BASE_URI };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedRenewState({ params, session });
  return redirect(t('protected-renew:file-your-taxes.return-btn-link'));
}

export default function ProtectedRenewFileYourTaxes() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { SCCH_BASE_URI } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const taxInfo = <InlineLink to={t('protected-renew:file-your-taxes.tax-info-href')} className="external-link" newTabIndicator target="_blank" />;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('protected.renew.state');
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('protected-renew:file-your-taxes.ineligible-to-renew')}</p>
        <p>{t('protected-renew:file-your-taxes.tax-not-filed')}</p>
        <p>{t('protected-renew:file-your-taxes.unable-to-assess')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:file-your-taxes.tax-info" components={{ taxInfo }} />
        </p>
        <p>{t('protected-renew:file-your-taxes.renew-after')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>
          {t('protected-renew:file-your-taxes.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Exit - File your taxes click">
          {t('protected-renew:file-your-taxes.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
