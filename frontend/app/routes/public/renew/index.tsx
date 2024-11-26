import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { startRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.index,
  pageTitleI18nKey: 'renew:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:index.page-title') }) };

  return { locale, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const id = randomUUID().toString();
  startRenewState({ id, session });

  return redirect(getPathById('public/renew/$id/terms-and-conditions', { ...params, id }));
}

export default function RenewIndex() {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    sessionStorage.setItem('renew.state', 'active');
  }, []);

  return (
    <>
      <div className="space-y-6">
        <section className="space-y-4">
          <p>{t('renew:index.eligibility')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('renew:index.full-name')}</li>
            <li>{t('renew:index.client-number')}</li>
            <li>{t('renew:index.dob')}</li>
            <li>{t('renew:index.sin')}</li>
            <li>{t('renew:index.address')}</li>
            <li>{t('renew:index.dental-coverage')}</li>
          </ul>
        </section>
        <section className="space-y-4">
          <h2 className="font-lato text-lg font-bold">{t('renew:index.renew-now')}</h2>
          <p>{t('renew:index.to-apply')}</p>
        </section>
      </div>
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton aria-describedby="application-consent" variant="green" id="continue-button" loading={isSubmitting} endIcon={faChevronRight}>
            {t('renew:index.start-button')}
          </LoadingButton>
          <ButtonLink id="back-button" to={t('renew:index.apply-link')} disabled={isSubmitting} startIcon={faChevronLeft}>
            {t('renew:index.back-button')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </>
  );
}
