import type { FormEvent } from 'react';

import { redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-apply-child';

import { TYPES } from '~/.server/constants';
import { loadApplyChildState } from '~/.server/routes/helpers/apply-child-route-helpers';
import { getAgeCategoryFromDateString } from '~/.server/routes/helpers/apply-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.contactApplyChild,
  pageTitleI18nKey: 'apply-child:contact-apply-child.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:contact-apply-child.page-title') }) };

  invariant(state.applicantInformation, 'Expected state.applicantInformation to be defined');
  const ageCategory = state.editModeApplicantInformation?.dateOfBirth ? getAgeCategoryFromDateString(state.editModeApplicantInformation.dateOfBirth) : getAgeCategoryFromDateString(state.applicantInformation.dateOfBirth);

  if (ageCategory !== 'children') {
    return redirect(getPathById('public/apply/$id/child/applicant-information', params));
  }

  return { meta };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  return redirect(t('apply-child:contact-apply-child.return-btn-link'));
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
  const serviceCanadaOfficeLink = <InlineLink to={t('apply-child:contact-apply-child.service-canada-office-link')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <div className="mb-8 space-y-4">
        <p>{t('apply-child:contact-apply-child.speak-service-canada')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:contact-apply-child.contact-service-canada" components={{ serviceCanadaOfficeLink, noWrap }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          routeId="public/apply/$id/child/applicant-information"
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Contact us to apply for your child click"
        >
          {t('apply-child:contact-apply-child.back-btn')}
        </ButtonLink>
        <LoadingButton type="submit" variant="primary" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Exit - Contact us to apply for your child click">
          {t('apply-child:contact-apply-child.return-btn')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
