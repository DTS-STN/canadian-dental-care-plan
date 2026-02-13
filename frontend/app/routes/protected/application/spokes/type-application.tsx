import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/type-application';

import { TYPES } from '~/.server/constants';
import { getProtectedApplicationState, saveProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const APPLICANT_TYPE = { adult: 'adult', family: 'family', children: 'children', delegate: 'delegate' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-spokes', 'gcweb'),
  pageIdentifier: pageIds.protected.application.spokes.typeOfApplication,
  pageTitleI18nKey: 'protected-application-spokes:type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = getProtectedApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-spokes:type-of-application.page-title') }) };

  return { meta, defaultState: state.typeOfApplication };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  getProtectedApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfApplicationSchema = z.object({ typeOfApplication: z.enum(APPLICANT_TYPE, { error: t('protected-application-spokes:type-of-application.error-message.type-of-application-required') }) });

  const parsedDataResult = typeOfApplicationSchema.safeParse({ typeOfApplication: String(formData.get('typeOfApplication') ?? '') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveProtectedApplicationState({ params, session, state: { typeOfApplication: parsedDataResult.data.typeOfApplication } });

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.delegate) {
    return redirect(getPathById('protected/application/$id/application-delegate', params));
  }

  return redirect(getPathById('protected/application/$id/type-of-application', params));
}

export default function ApplicationTypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;

  return (
    <div className="max-w-prose">
      <p className="mt-8 mb-4 italic">{t('protected-application:required-label')}</p>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="type-of-application"
            name="typeOfApplication"
            legend={t('protected-application-spokes:type-of-application.form-instructions')}
            options={[
              { value: APPLICANT_TYPE.adult, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:type-of-application.radio-options.personal" />, defaultChecked: defaultState === APPLICANT_TYPE.adult },
              { value: APPLICANT_TYPE.children, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:type-of-application.radio-options.child" />, defaultChecked: defaultState === APPLICANT_TYPE.children },
              { value: APPLICANT_TYPE.family, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:type-of-application.radio-options.personal-and-child" />, defaultChecked: defaultState === APPLICANT_TYPE.family },
              { value: APPLICANT_TYPE.delegate, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-spokes:type-of-application.radio-options.delegate" />, defaultChecked: defaultState === APPLICANT_TYPE.delegate },
            ]}
            required
            errorMessage={errors?.typeOfApplication}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="save-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Type of application click">
              {t('protected-application-spokes:type-of-application.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="protected/application/$id/type-of-application"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Type of application click"
            >
              {t('protected-application-spokes:type-of-application.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
