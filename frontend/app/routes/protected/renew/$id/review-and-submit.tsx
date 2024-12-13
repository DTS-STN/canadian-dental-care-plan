import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { isPrimaryApplicantStateComplete, loadProtectedRenewState, validateProtectedChildrenStateForReview } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { Button } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Submit = 'submit',
  Back = 'back',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.reviewSubmit,
  pageTitleI18nKey: 'protected-renew:review-submit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:review-submit.page-title') }) };

  const primaryApplicantName = isPrimaryApplicantStateComplete(state) ? `${state.clientApplication.applicantInformation.firstName} ${state.clientApplication.applicantInformation.lastName}` : undefined;
  const children = validateProtectedChildrenStateForReview(state.children);

  return {
    meta,
    primaryApplicantName,
    children,
  };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const formData = await request.formData();

  const state = loadProtectedRenewState({ params, session });
  const children = validateProtectedChildrenStateForReview(state.children);

  const formAction = z.nativeEnum(FormAction).parse(formData.get('_action'));
  if (formAction === FormAction.Back) {
    if (children.length > 0) return redirect(getPathById('protected/renew/$id/review-child-information', params));
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  //TODO: Implement data submission to MSCA backend

  return redirect(getPathById('protected/renew/$id/confirmation', params));
}

export default function ProtectedRenewReviewSubmit() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { primaryApplicantName, children } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <p className="mb-4">{t('protected-renew:review-submit.form-instructions')}</p>
      <ul className="my-6 list-inside list-disc space-y-2">
        {primaryApplicantName && <li>{primaryApplicantName}</li>}
        {children.map((child) => {
          const childName = `${child.information?.firstName} ${child.information?.lastName}`;
          return <li key={childName}>{childName}</li>;
        })}
      </ul>
      <h2 className="font-lato text-lg font-bold">{t('protected-renew:review-submit.submit-renewal-title')}</h2>
      <p className="mb-4">{t('protected-renew:review-submit.submit-p-proceed')}</p>
      <p className="mb-4">{t('protected-renew:review-submit.submit-p-false-info')}</p>
      <p className="mb-4">{t('protected-renew:review-submit.submit-p-repayment')}</p>
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            id="submit-button"
            name="_action"
            value={FormAction.Submit}
            variant="green"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application Form:Continue - Review and submit click"
          >
            {t('protected-renew:review-submit.submit-button')}
          </LoadingButton>
          <Button id="back-button" name="_action" value={FormAction.Back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application Form:Back - Review and submit click">
            {t('protected-renew:review-submit.back-button')}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
