import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/child-social-insurance-number';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, getSingleChildState, saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import type { ApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';

function getRouteFromApplicationFlow(applicationFlow: ApplicationFlow) {
  switch (applicationFlow) {
    case 'full-children': {
      return `protected/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    default: {
      return `protected/application/$id/${applicationFlow}/contact-information`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application-spokes', 'protected-application', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.childSocialInsuranceNumber,
  pageTitleI18nKey: 'protected-application-spokes:children.social-insurance-number.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-adult', 'full-children', 'full-family', 'simplified-adult', 'simplified-family', 'simplified-children']);
  const childState = getSingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('protected-application-spokes:children.child-number', { childNumber: childState.childNumber });
  const childName = childState.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:children.social-insurance-number.page-title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('protected-application-spokes:children.social-insurance-number.page-title', { childName: childNumber }) }),
  };

  return {
    meta,
    childSin: childState.information?.socialInsuranceNumber,
    childName,
    i18nOptions: { childName },
    applicationFlow: `${state.inputModel}-${state.typeOfApplication}`,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getProtectedApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-adult', 'full-children', 'full-family', 'simplified-adult', 'simplified-family', 'simplified-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const childState = getSingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicationFlow: ApplicationFlow = `${state.inputModel}-${state.typeOfApplication}`;

  const sinSchema = z.object({
    socialInsuranceNumber: z
      .string()
      .trim()
      .optional()
      .superRefine((sin, ctx) => {
        if (sin && !isValidSin(sin)) {
          ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:personal-information.error-message.sin-valid') });
        } else if (sin && formatSin(sin) === formatSin(childState.information?.socialInsuranceNumber ?? '')) {
          ctx.addIssue({ code: 'custom', message: t('protected-application-spokes:personal-information.error-message.sin-unique') });
        }
      }),
  });

  const parsedDataResult = sinSchema.safeParse({
    socialInsuranceNumber: formData.get('socialInsuranceNumber')?.toString(),
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
          childInformation: {
            ...child.information,
            socialInsuranceNumber: parsedDataResult.data.socialInsuranceNumber,
          },
        };
      }),
    },
  });

  return redirect(getPathById(getRouteFromApplicationFlow(applicationFlow), params));
}

export default function ChildSocialInsuranceNumber({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { childSin, applicationFlow, childName } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  return (
    <div className="max-w-prose">
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <p className="mb-4 italic">{t('protected-application:optional-label')}</p>
          <div className="mb-6">
            <InputPatternField
              id="social-insurance-number"
              name="socialInsuranceNumber"
              format={sinInputPatternFormat}
              label={t('protected-application-spokes:children.social-insurance-number.legend', { childName })}
              inputMode="numeric"
              helpMessagePrimary={t('protected-application-spokes:children.social-insurance-number.help-message')}
              helpMessagePrimaryClassName="text-black"
              defaultValue={childSin ?? ''}
              errorMessage={errors?.socialInsuranceNumber}
            />
          </div>
          <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="save-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Child social insurance number click">
              {t('protected-application-spokes:children.social-insurance-number.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`protected/application/$id/${applicationFlow}/childrens-application`}
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child social insurance number click"
            >
              {t('protected-application-spokes:children.social-insurance-number.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
