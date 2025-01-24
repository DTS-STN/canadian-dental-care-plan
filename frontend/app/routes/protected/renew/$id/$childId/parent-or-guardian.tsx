import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewSingleChildState, loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum ParentOrGuardianOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.parentOrGuardian,
  pageTitleI18nKey: 'protected-renew:children.parent-or-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewSingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('protected-renew:children.child-number', { childNumber: state.childNumber });
  const childName = state.information?.firstName ?? childNumber;

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:children.parent-or-guardian.page-title', { childName }) }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.renew.child-parent-or-guardian', { userId: idToken.sub });

  return { meta, defaultState: state.isParentOrLegalGuardian, childName, i18nOptions: { childName } };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewSingleChildState({ params, request, session });
  const protectedRenewState = loadProtectedRenewState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const parentOrGuardianSchema = z.object({
    parentOrGuardian: z.nativeEnum(ParentOrGuardianOption, {
      errorMap: () => ({ message: t('protected-renew:children.parent-or-guardian.error-message.parent-or-guardian-required') }),
    }),
  });

  const parsedDataResult = parentOrGuardianSchema.safeParse({
    parentOrGuardian: formData.get('parentOrGuardian'),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({
    params,
    request,
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

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.renew.child-parent-or-guardian', { userId: idToken.sub });

  if (parsedDataResult.data.parentOrGuardian === ParentOrGuardianOption.No) {
    return redirect(getPathById('protected/renew/$id/$childId/parent-or-guardian-required', params));
  }

  return redirect(getPathById('protected/renew/$id/$childId/dental-insurance', params));
}

export default function ProtectedRenewParentOrGuardian() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, childName } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { parentOrGuardian: 'input-radio-parent-or-guardian-option-0' });

  return (
    <div className="max-w-prose">
      <p className="mb-4 italic">{t('renew:required-label')}</p>
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <InputRadios
          id="parent-or-guardian"
          name="parentOrGuardian"
          legend={t('protected-renew:children.parent-or-guardian.form-instructions', { childName })}
          options={[
            { value: ParentOrGuardianOption.Yes, children: t('protected-renew:children.parent-or-guardian.radio-options.yes'), defaultChecked: defaultState === true },
            { value: ParentOrGuardianOption.No, children: t('protected-renew:children.parent-or-guardian.radio-options.no'), defaultChecked: defaultState === false },
          ]}
          errorMessage={errors?.parentOrGuardian}
          required
        />
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton type="submit" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Continue - Parent or legal guardian click">
            {t('protected-renew:children.parent-or-guardian.continue-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            routeId="protected/renew/$id/member-selection"
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Protected:Back - Parent or legal guardian click"
          >
            {t('protected-renew:children.parent-or-guardian.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
