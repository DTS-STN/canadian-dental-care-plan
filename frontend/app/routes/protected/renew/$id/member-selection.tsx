import type { ReactNode } from 'react';

import { redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/member-selection';

import { TYPES } from '~/.server/constants';
import { isChildrenStateComplete, isInvitationToApplyClient, isPrimaryApplicantStateComplete, loadProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import type { AppLinkProps } from '~/components/app-link';
import { AppLink } from '~/components/app-link';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorAlert } from '~/components/error-alert';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
  save: 'save',
  back: 'back',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.memberSelection,
  pageTitleI18nKey: 'protected-renew:member-selection.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

type Member = {
  id: string;
  applicantName: string;
  previouslyReviewed: boolean | undefined;
  typeOfApplicant: 'child' | 'primary';
};

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:member-selection.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.member-selection', { userId: idToken.sub });

  const members: Member[] = [];

  // primary member
  if (state.clientApplication.typeOfApplication !== 'child') {
    members.push({
      id: state.id,
      applicantName: `${state.clientApplication.applicantInformation.firstName} ${state.clientApplication.applicantInformation.lastName}`,
      previouslyReviewed: state.previouslyReviewed,
      typeOfApplicant: 'primary',
    });
  }

  // children members
  members.push(
    ...state.children.map<Member>((child) => ({
      id: child.id,
      applicantName: `${child.information?.firstName} ${child.information?.lastName}`,
      previouslyReviewed: child.previouslyReviewed,
      typeOfApplicant: 'child',
    })),
  );

  return { meta, members, isItaCandidate: isInvitationToApplyClient(state.clientApplication) };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, request, session });
  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.member-selection', { userId: idToken.sub });

  if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled) && !isChildrenStateComplete(state, demographicSurveyEnabled)) {
    return { status: 'select-member' };
  }

  return redirect(getPathById('protected/renew/$id/communication-preference', params));
}

export default function ProtectedRenewMemberSelection({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { members, isItaCandidate } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const fetcherStatus = typeof fetcher.data === 'object' && 'status' in fetcher.data ? fetcher.data.status : undefined;
  const { ErrorAlert } = useErrorAlert(fetcherStatus === 'select-member');

  return (
    <div className="max-w-prose">
      <ErrorAlert>
        <h2 className="mb-2 font-bold">{t('protected-renew:member-selection.select-member.heading')}</h2>
        <InlineLink role="alert" aria-live="polite" to="#primary-applicant" className="mb-2">
          {t('protected-renew:member-selection.select-member.to-continue')}
        </InlineLink>
      </ErrorAlert>
      <p className="mb-4">{t('protected-renew:member-selection.form-instructions')}</p>
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mt-6 space-y-8">
          {members.map((member) =>
            member.typeOfApplicant === 'primary' ? (
              <CardLink
                key={member.applicantName}
                title={member.applicantName}
                previouslyReviewed={member.previouslyReviewed}
                routeId={isItaCandidate ? 'protected/renew/$id/confirm-marital-status' : 'protected/renew/$id/dental-insurance'}
                params={params}
              />
            ) : (
              <CardLink key={member.applicantName} title={member.applicantName} previouslyReviewed={member.previouslyReviewed} routeId="protected/renew/$id/$childId/parent-or-guardian" params={{ ...params, childId: member.id }} />
            ),
          )}
        </div>
        <p className="my-4">{t('protected-renew:member-selection.continue-help')}</p>
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            id="continue-button"
            name="_action"
            value={FORM_ACTION.continue}
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
    <AppLink className="flex flex-row items-center gap-4 rounded-xl border border-slate-300 bg-slate-50 p-6 hover:shadow-md focus:ring-2 focus:ring-blue-600 focus:outline-none" routeId={routeId} {...props}>
      <span aria-description={t('protected-renew:member-selection.select-member-help')} className="font-lato text-2xl leading-8 font-semibold text-blue-600 underline">
        {title}
      </span>
      {previouslyReviewed && (
        <>
          <FontAwesomeIcon fixedWidth icon={faCircleCheck} className="ml-4 size-10 self-center" style={{ color: 'green' }} />
          <p className="ml-4 self-center">{t('protected-renew:member-selection.completed')}</p>
        </>
      )}
    </AppLink>
  );
}
