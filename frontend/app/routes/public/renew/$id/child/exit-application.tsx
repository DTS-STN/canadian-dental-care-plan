import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { redirect, useFetcher, useParams } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { loadRenewChildState } from '~/.server/routes/helpers/renew-child-route-helpers';
import { clearRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.child.exitApplication,
  pageTitleI18nKey: 'renew-child:exit-application.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const { id } = loadRenewChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-child:exit-application.page-title') }) };

  return { id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearRenewState({ params, session });
  return redirect(t('renew-child:exit-application.exit-link'));
}

export default function RenewChildExitApplication() {
  const { t } = useTranslation(handle.i18nNamespaces);

  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('renew-child:exit-application.are-you-sure')}</p>
        <p>{t('renew-child:exit-application.click-back')}</p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="public/renew/$id/child/review-adult-information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Back - Exiting the application click"
        >
          {t('renew-child:exit-application.back-btn')}
        </ButtonLink>
        <LoadingButton variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Child:Exit - Exiting the application click">
          {t('renew-child:exit-application.exit-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
