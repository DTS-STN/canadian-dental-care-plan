import type { FormEvent } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewSingleChildState, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum ParentOrGuardianOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.parentOrGuardian,
  pageTitleI18nKey: 'protected-renew:children.parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession(request);

  const state = loadProtectedRenewSingleChildState({ params, session });
  // TODO: get childName from state and pass to title and page heading

  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:children.parent-or-guardian.page-title') }) };

  return { csrfToken, meta, defaultState: state.isParentOrLegalGuardian };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('protected/renew/parent-or-guardian');

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession(request);

  const state = loadProtectedRenewSingleChildState({ params, session });
  const protectedRenewState = loadProtectedRenewState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const parentOrGuardianSchema = z.object({
    parentOrGuardian: z.nativeEnum(ParentOrGuardianOption, {
      errorMap: () => ({ message: t('protected-renew:children.parent-or-guardian.error-message.parent-or-guardian-required') }),
    }),
  });

  const data = { parentOrGuardian: formData.get('parentOrGuardian') };
  const parsedDataResult = parentOrGuardianSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({
    params,
    session,
    state: {
      children: protectedRenewState.children.map((child) => {
        if (child.id !== state.id) return child;
        return {
          ...child,
          isParentOrLegalGuardian: parsedDataResult.data.parentOrGuardian === ParentOrGuardianOption.Yes,
        };
      }),
    },
  });

  return redirect(getPathById('protected/renew/$id/$childId/dental-insurance', params));
}

export default function ProtectedRenewParentOrGuardian() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { taxFiling: 'input-radio-parent-or-guardian-option-0' });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('protected.renew.state');
  }

  return (
    <>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <InputRadios
          id="parent-or-guardian"
          name="parentOrGuardian"
          legend={t('protected-renew:children.parent-or-guardian.form-instructions')}
          options={[
            { value: ParentOrGuardianOption.Yes, children: t('protected-renew:children.parent-or-guardian.radio-options.yes'), defaultChecked: defaultState === true },
            { value: ParentOrGuardianOption.No, children: t('protected-renew:children.parent-or-guardian.radio-options.no'), defaultChecked: defaultState === false },
          ]}
          errorMessage={errors?.taxFiling}
          required
        />
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton type="submit" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Exit - Child must be a parent or legal guardian click">
            {t('protected-renew:children.parent-or-guardian.continue-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            // TODO: replace with proper route (needs a valid route otherwise will error)
            // routeId="protected/renew/$id/member-selection"
            routeId="protected/renew/$id/tax-filing"
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Child must be a parent or legal guardian click"
          >
            {t('protected-renew:children.parent-or-guardian.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </>
  );
}
