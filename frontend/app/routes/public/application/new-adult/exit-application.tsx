import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/exit-application';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationAdultState } from '~/.server/routes/helpers/public-application-adult-route-helpers';
import { clearPublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('application-full-adult', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.newAdult.exitApplication,
  pageTitleI18nKey: 'application-full-adult:exit-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadPublicApplicationAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['new-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-adult:exit-application.page-title') }) };
  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = loadPublicApplicationAdultState({ params, request, session });
  validateApplicationFlow(state, params, ['new-adult']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearPublicApplicationState({ params, session });

  return redirect(t('application-full-adult:exit-application.exit-link'));
}

export default function NewAdultExitApplication({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('application-full-adult:exit-application.are-you-sure')}</p>
        <p>{t('application-full-adult:exit-application.click-back')}</p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          variant="secondary"
          routeId="public/application/$id/new-adult/submit"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Exiting the application click"
        >
          {t('application-full-adult:exit-application.back-btn')}
        </ButtonLink>
        <LoadingButton variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Exit - Exiting the application click">
          {t('application-full-adult:exit-application.exit-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
