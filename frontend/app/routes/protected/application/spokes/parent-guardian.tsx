import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import type { Route } from './+types/parent-guardian';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, getSingleChildState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { ChildInformationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const YES_NO_OPTION = {
  yes: 'yes',
  no: 'no',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.parentGuardian,
  pageTitleI18nKey: 'protected-application-spokes:children.parent-guardian.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-children', 'intake-family', 'renewal-children', 'renewal-family']);
  const childState = getSingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('protected-application-spokes:children.child-number', { childNumber: childState.childNumber });
  const childName = childState.isNew ? childNumber : (childState.information?.firstName ?? childNumber);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:children.parent-guardian.page-title') }) };

  return { meta, defaultState: childState.information, childName, applicationFlow: `${state.context}-${state.typeOfApplication}` as const };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['intake-children', 'intake-family', 'renewal-children', 'renewal-family']);
  const childState = getSingleChildState({ params, request, session });

  const formData = await request.formData();
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const parentGuardianSchema = z.object({
    isParent: z.boolean({ error: t('protected-application-spokes:children.parent-guardian.is-parent') }),
  });

  const parsedDataResult = parentGuardianSchema.safeParse({
    isParent: formData.get('isParent') ? formData.get('isParent') === YES_NO_OPTION.yes : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveProtectedApplicationState({
    params,
    session,
    state: {
      children: state.children.map((child) => {
        if (child.id !== childState.id) return child;
        return {
          ...child,
          information: {
            ...child.information,
            isParent: parsedDataResult.data.isParent,
          } as ChildInformationState,
        };
      }),
    },
  });

  if (!parsedDataResult.data.isParent) {
    return redirect(getPathById('protected/application/$id/children/$childId/parent-or-guardian', params));
  }

  return redirect(getPathById(`protected/application/$id/${state.context}-${state.typeOfApplication}/childrens-application`, params));
}

export default function ParentGuardian({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, childName, applicationFlow } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  return (
    <fetcher.Form method="post" noValidate>
      <div className="mb-8 space-y-4">
        <InputRadios
          id="is-parent-radios"
          name="isParent"
          legend={t('protected-application-spokes:children.parent-guardian.parent-legend', { childName })}
          options={[
            { value: YES_NO_OPTION.yes, children: t('protected-application-spokes:children.parent-guardian.radio-options.yes'), defaultChecked: defaultState?.isParent === true },
            { value: YES_NO_OPTION.no, children: t('protected-application-spokes:children.parent-guardian.radio-options.no'), defaultChecked: defaultState?.isParent === false },
          ]}
          errorMessage={errors?.isParent}
          required
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CsrfTokenInput />
        <ButtonLink
          id="back-button"
          variant="secondary"
          routeId={`protected/application/$id/${applicationFlow}/childrens-application`}
          params={params}
          disabled={isSubmitting}
          startIcon={faChevronLeft}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Application Form-Child:Back - Child parent or guardian needs to apply click"
        >
          {t('protected-application-spokes:children.parent-guardian.back-btn')}
        </ButtonLink>
        <LoadingButton id="save-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Application Form-Child:Save - Child Information click">
          {t('protected-application-spokes:children.parent-guardian.save-btn')}
        </LoadingButton>
      </div>
    </fetcher.Form>
  );
}
