import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/exit-application';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationRenewalAdultState } from '~/.server/routes/helpers/protected-application-renewal-adult-route-helpers';
import { clearProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-renewal-adult', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.renewalAdult.exitApplication,
  pageTitleI18nKey: 'protected-application-renewal-adult:exit-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-renewal-adult:exit-application.page-title') }) };
  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationRenewalAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['renewal-adult']);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearProtectedApplicationState({ params, session });

  return redirect(t('protected-application-renewal-adult:exit-application.exit-link'));
}

export default function ProtectedNewAdultExitApplication({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('protected-application-renewal-adult:exit-application.are-you-sure')}</p>
        <p>{t('protected-application-renewal-adult:exit-application.click-back')}</p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          variant="secondary"
          routeId="protected/application/$id/renewal-adult/submit"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Back - Exiting the application click"
        >
          {t('protected-application-renewal-adult:exit-application.back-btn')}
        </ButtonLink>
        <LoadingButton variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Renewal_Adult:Exit - Exiting the application click">
          {t('protected-application-renewal-adult:exit-application.exit-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
