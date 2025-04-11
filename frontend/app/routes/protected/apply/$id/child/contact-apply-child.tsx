import type { FormEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';

import type { Route } from './+types/contact-apply-child';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyChildState } from '~/.server/routes/helpers/protected-apply-child-route-helpers';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply-child', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.child.contactApplyChild,
  pageTitleI18nKey: 'protected-apply-child:contact-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const state = loadProtectedApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply-child:contact-apply-child.page-title') }) };

  invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');
  const ageCategory = state.editModeApplicantInformation?.dateOfBirth ? getAgeCategoryFromDateString(state.editModeApplicantInformation.dateOfBirth) : getAgeCategoryFromDateString(state.applicantInformation.dateOfBirth);

  if (ageCategory !== 'children') {
    instrumentationService.countHttpStatus('protected.apply.child.contact-apply-child', 302);
    return redirect(getPathById('protected/apply/$id/child/applicant-information', params));
  }

  instrumentationService.countHttpStatus('protected.apply.child.contact-apply-child', 200);
  return { id: state.id, meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  instrumentationService.countHttpStatus('protected.apply.child.contact-apply-child', 302);
  return redirect(t('protected-apply-child:contact-apply-child.return-btn-link'));
}

export default function ApplyFlowContactApplyChild({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  const noWrap = <span className="whitespace-nowrap" />;
  const serviceCanadaOfficeLink = <InlineLink to={t('protected-apply-child:contact-apply-child.service-canada-office-link')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('protected-apply-child:contact-apply-child.speak-service-canada')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply-child:contact-apply-child.contact-service-canada" components={{ serviceCanadaOfficeLink, noWrap }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="protected/apply/$id/child/applicant-information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Back - Contact us to apply for your child click"
        >
          {t('protected-apply-child:contact-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Child:Exit - Contact us to apply for your child click">
          {t('protected-apply-child:contact-apply-child.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
