import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { isChildrenStateComplete, isPrimaryApplicantStateComplete, loadProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { AppLinkProps } from '~/components/app-link';
import { AppLink } from '~/components/app-link';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
  Back = 'back',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.memberSelection,
  pageTitleI18nKey: 'protected-renew:member-selection.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:member-selection.page-title') }) };

  const children = state.children;

  return { meta, externallyReviewed: state.externallyReviewed, previouslyReviewed: state.previouslyReviewed, clientApplication: state.clientApplication, children };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, session });
  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled) && !isChildrenStateComplete(state, demographicSurveyEnabled)) {
    return { status: 'select-member' };
  }

  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewMemberSelection() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { externallyReviewed, previouslyReviewed, clientApplication, children } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const applicantName = `${clientApplication.applicantInformation.firstName} ${clientApplication.applicantInformation.lastName}`;
  const hasExternalReviews = externallyReviewed ?? children.filter((child) => child.externallyReviewed === true).length > 0;

  return (
    <div className="max-w-prose">
      {fetcherStatus === 'select-member' && <SelectMember />}
      {hasExternalReviews && (
        <>
          <p className="mb-4">{t('protected-renew:member-selection.reviewed')}</p>
          <ul className="list-disc space-y-2 pl-10">
            {externallyReviewed && (
              <li key={applicantName} className="mb-4">
                {applicantName}
              </li>
            )}
            {children
              .filter((child) => child.externallyReviewed === true)
              .map((child) => {
                const childName = `${child.information?.firstName} ${child.information?.lastName}`;
                return (
                  <li key={childName} className="mb-4">
                    {childName}
                  </li>
                );
              })}
          </ul>
        </>
      )}
      <p className="mb-4">{t('protected-renew:member-selection.form-instructions')}</p>
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mt-6 space-y-8">
          <CardLink id="primary-applicant" key={applicantName} title={applicantName} previouslyReviewed={previouslyReviewed} routeId="protected/renew/$id/dental-insurance" params={params} />
          {children.map((child) => {
            const childName = `${child.information?.firstName} ${child.information?.lastName}`;
            return <CardLink key={childName} title={childName} previouslyReviewed={child.previouslyReviewed} routeId="protected/renew/$id/$childId/parent-or-guardian" params={{ ...params, childId: child.id }} />;
          })}
        </div>
        <p className="my-4">{t('protected-renew:member-selection.continue-help')}</p>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            id="continue-button"
            name="_action"
            value={FormAction.Continue}
            variant="primary"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Renew your Canadian Dental Care Plan benefits click"
          >
            {t('protected-renew:member-selection.continue-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            routeId="protected/renew/$id/tax-filing"
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Renew your Canadian Dental Care Plan benefits click"
          >
            {t('protected-renew:member-selection.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}

interface CardLinkProps extends OmitStrict<AppLinkProps, 'className' | 'title'> {
  routeId: string;
  title: ReactNode;
  previouslyReviewed?: boolean;
}

function CardLink({ routeId, title, previouslyReviewed, ...props }: CardLinkProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  return (
    <AppLink className="flex flex-row items-center gap-4 rounded-xl border border-slate-300 bg-slate-50 p-6 hover:shadow-md" routeId={routeId} {...props}>
      <h2 className="font-lato text-2xl font-semibold leading-8 text-blue-600 underline">{title}</h2>
      {previouslyReviewed && (
        <>
          <FontAwesomeIcon fixedWidth icon={faCircleCheck} className="ml-4 size-10 self-center" style={{ color: 'green' }} />
          <p className="ml-4 self-center">{t('protected-renew:member-selection.completed')}</p>
        </>
      )}
    </AppLink>
  );
}

function SelectMember() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({ behavior: 'smooth' });
      wrapperRef.current.focus();
    }
  }, []);

  return (
    <div ref={wrapperRef} id="select-member" className="mb-4">
      <ContextualAlert type="danger">
        <h2 className="mb-2 font-bold">{t('protected-renew:member-selection.select-member.heading')}</h2>
        <InlineLink to="#primary-applicant" className="mb-2">
          {t('protected-renew:member-selection.select-member.to-continue')}
        </InlineLink>
      </ContextualAlert>
    </div>
  );
}
