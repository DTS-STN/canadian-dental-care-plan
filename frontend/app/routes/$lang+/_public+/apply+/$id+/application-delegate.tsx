import { FormEvent } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.applicationDelegate,
  pageTitleI18nKey: 'apply:eligibility.application-delegate.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const { id } = await applyRouteHelpers.loadState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.application-delegate.page-title') }) };

  return json({ id, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  await applyRouteHelpers.loadState({ params, request, session });
  const sessionResponseInit = await applyRouteHelpers.clearState({ params, request, session });
  return redirectWithLocale(request, '/', sessionResponseInit);
}

export default function ApplyFlowApplicationDelegate() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const contactServiceCanada = <InlineLink to={t('apply:eligibility.application-delegate.contact-service-canada-href')} />;
  const preparingToApply = <InlineLink to={t('apply:eligibility.application-delegate.preparing-to-apply-href')} />;
  const span = <span className="whitespace-nowrap" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.application-delegate.contact-representative" components={{ contactServiceCanada, span }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.application-delegate.prepare-to-apply" components={{ preparingToApply }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <ButtonLink type="button" to={`/apply/${id}/type-of-application`} disabled={isSubmitting}>
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply:eligibility.application-delegate.back-btn')}
        </ButtonLink>
        <ButtonLink type="submit" variant="primary" onClick={() => sessionStorage.removeItem('flow.state')} to={t('apply:eligibility.application-delegate.return-btn-link')}>
          {t('apply:eligibility.application-delegate.return-btn')}
          {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </ButtonLink>
      </fetcher.Form>
    </>
  );
}
