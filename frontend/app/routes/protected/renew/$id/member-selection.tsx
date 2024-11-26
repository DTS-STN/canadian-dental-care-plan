import type { ReactNode } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { getProtectedChildrenState, loadProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { AppLinkProps } from '~/components/app-link';
import { AppLink } from '~/components/app-link';
import { Button, ButtonLink } from '~/components/buttons';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
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

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:member-selection.page-title') }) };

  const applicant = state.applicantInformation;
  const children = getProtectedChildrenState(state);

  return { csrfToken, meta, applicant, children, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, session });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/member-selection', params)); //TODO: Update to 'review and submit' when page is added
  }
  return redirect(getPathById('protected/renew/$id/review-adult-information', params));
}

export default function ProtectedRenewMemberSelection() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, applicant, children, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const applicantName = `${applicant?.firstName} ${applicant?.lastName}`;

  const hasExternalReviews = applicant?.externallyReviewed ?? children.filter((child) => child.externallyReviewed === true).length > 0;

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={81} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        {hasExternalReviews && (
          <>
            <p className="mb-4">{t('protected-renew:member-selection.reviewed')}</p>
            <ul className="list-disc space-y-2 pl-10">
              {applicant?.externallyReviewed && (
                <li key={applicantName} className="mb-4">
                  {applicantName}
                </li>
              )}
              {children
                .filter((child) => child.externallyReviewed === true)
                .map((child) => {
                  const childName = `${child.firstName} ${child.lastName}`;
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
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mt-6 space-y-8">
            <CardLink key={applicantName} title={applicantName} previouslyReviewed={applicant?.previouslyReviewed} routeId="protected/renew/$id/dental-insurance" params={params} />
            {children.map((child) => {
              const childName = `${child.firstName} ${child.lastName}`;
              return <CardLink key={childName} title={childName} previouslyReviewed={child.previouslyReviewed} routeId="protected/renew/$id/$childId/parent-or-guardian" params={{ ...params, childId: child.id }} />;
            })}
          </div>
          <p className="my-4">{t('protected-renew:member-selection.continue-help')}</p>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Protectd Renew Application Form:Save - Member selection click">
                {t('protected-renew:member-selection.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application Form:Cancel - Member selection click">
                {t('protected-renew:member-selection.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application Form:Continue - Member selection click"
              >
                {t('protected-renew:member-selection.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/tax-filing"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application Form:Back - Member selection click"
              >
                {t('protected-renew:member-selection.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
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
    <AppLink className="flex flex-row gap-4 rounded-xl border border-slate-300 bg-slate-50 p-6 hover:shadow-md" routeId={routeId} {...props}>
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
