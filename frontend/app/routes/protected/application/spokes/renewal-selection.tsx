import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/renewal-selection';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, saveProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputCheckboxes } from '~/components/input-checkboxes';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.renewalSelection,
  pageTitleI18nKey: 'protected-application-spokes:renewal-selection.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:renewal-selection.page-title') }) };

  invariant(state.clientApplication, 'Expected clientApplication to be defined');

  const applicants = [
    { id: state.clientApplication.applicantInformation.clientId, name: `${state.clientApplication.applicantInformation.firstName} ${state.clientApplication.applicantInformation.lastName}` },
    ...state.clientApplication.children.map((child) => ({ id: child.information.clientId, name: `${child.information.firstName} ${child.information.lastName}` })),
  ];

  return { meta, state: state.applicantClientIdsToRenew ?? [], applicants };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicantsSchema = z.object({ applicants: z.array(z.string().trim()).nonempty(t('protected-application-spokes:renewal-selection.error-message.renewal-selection-required')) });

  const parsedDataResult = applicantsSchema.safeParse({ applicants: formData.getAll('applicants') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveProtectedApplicationState({ params, session, state: { applicantClientIdsToRenew: parsedDataResult.data.applicants } });

  return redirect(getPathById('protected/application/$id/type-of-application', params));
}

export default function ProtectedSpokesRenewalSelection({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { state, applicants } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('protected-application:required-label')}</p>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputCheckboxes
            id="applicants"
            name="applicants"
            legend={t('protected-application-spokes:renewal-selection.select')}
            options={applicants.map((applicant) => ({
              value: applicant.id,
              children: applicant.name,
              defaultChecked: state.includes(applicant.id),
            }))}
            errorMessage={errors?.applicants}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="save-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Renewal selection click">
              {t('protected-application-spokes:renewal-selection.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="protected/application/$id/type-of-application"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Renewal selection click"
            >
              {t('protected-application-spokes:renewal-selection.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
