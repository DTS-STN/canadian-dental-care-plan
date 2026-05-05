import { redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/application-delegate';

import { TYPES } from '~/.server/constants';
import { clearProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { useApplicationFlowStorage, useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protectedApplicationSpokes', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.applicationDelegate,
  pageTitleI18nKey: 'protectedApplicationSpokes:applicationDelegate.pageTitle',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protectedApplicationSpokes:applicationDelegate.pageTitle') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplicationState({ params, session });

  return redirect(t('protectedApplicationSpokes:applicationDelegate.exitBtnLink'));
}

export default function ApplicationDelegate({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { remove: removeApplicationFlowStorageValue } = useApplicationFlowStorage();

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const contactServiceCanada = <InlineLink to={t('protectedApplicationSpokes:applicationDelegate.contactServiceCanadaHref')} className="external-link" newTabIndicator target="_blank" />;
  const preparingToApply = <InlineLink to={t('protectedApplicationSpokes:applicationDelegate.preparingToApplyHref')} className="external-link" newTabIndicator target="_blank" />;
  const noWrap = <span className="whitespace-nowrap" />;

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    removeApplicationFlowStorageValue();
  }

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protectedApplicationSpokes:applicationDelegate.contactRepresentative" components={{ contactServiceCanada, noWrap }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protectedApplicationSpokes:applicationDelegate.prepareToApply" components={{ preparingToApply }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          variant="secondary"
          type="button"
          routeId="protected/application/$id/type-application"
          params={params}
          disabled={isSubmitting}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Back - Applying on behalf of someone click"
        >
          {t('protectedApplicationSpokes:applicationDelegate.backBtn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Spoke:Exit - Applying on behalf of someone click">
          {t('protectedApplicationSpokes:applicationDelegate.exitBtn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
