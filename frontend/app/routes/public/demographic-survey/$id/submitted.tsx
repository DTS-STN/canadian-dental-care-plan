import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { clearDemographicSurveyState } from '~/.server/routes/helpers/demographic-survey-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('demographic-survey', 'gcweb'),
  pageIdentifier: pageIds.public.demographicSurvey.submitted,
  pageTitleI18nKey: 'demographic-survey:submitted.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('demographic-survey:submitted.page-title') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  clearDemographicSurveyState({ params, session });
  return redirect(t('demographic-survey:submitted.exit-link'));
}

export default function DemographicSurveySubmitted() {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('demographic-survey:submitted.response-submitted')}</p>
        <p>{t('demographic-survey:submitted.thank-you')}</p>
      </div>
      <fetcher.Form method="post" noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <LoadingButton variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Submitted - Exiting the application click">
          {t('demographic-survey:submitted.close-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
