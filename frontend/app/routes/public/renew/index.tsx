import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { redirect, useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { LoadingButton } from '~/components/loading-button';
import { startRenewState } from '~/route-helpers/renew-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
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

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const csrfToken = String(session.get('csrfToken'));

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:index.page-title') }) };

  return json({ locale, meta, csrfToken });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/index');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const id = randomUUID().toString();
  startRenewState({ id, session });

  return redirect(getPathById('public/renew/$id/terms-and-conditions', { ...params, id }));
}

export default function RenewIndex() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
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
        <input type="hidden" name="_csrf" value={csrfToken} />
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
