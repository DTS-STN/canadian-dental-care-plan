import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/type-application';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const APPLICANT_TYPE = { adult: 'adult', family: 'family', children: 'children', delegate: 'delegate' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-spokes', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.typeOfApplication,
  pageTitleI18nKey: 'application-spokes:type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:type-of-application.page-title') }) };

  return { meta, defaultState: state.typeOfApplication };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfApplicationSchema = z.object({ typeOfApplication: z.enum(APPLICANT_TYPE, { error: t('application-spokes:type-of-application.error-message.type-of-application-required') }) });

  const parsedDataResult = typeOfApplicationSchema.safeParse({ typeOfApplication: String(formData.get('typeOfApplication') ?? '') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({ params, session, state: { typeOfApplication: parsedDataResult.data.typeOfApplication } });

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.delegate) {
    return redirect(getPathById('public/application/$id/application-delegate', params));
  }

  return redirect(getPathById('public/application/$id/type-of-application', params));
}

export default function ApplicationTypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = fetcher.data?.errors;

  return (
    <div className="max-w-prose">
      <p className="mt-8 mb-4 italic">{t('application:required-label')}</p>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="type-of-application"
            name="typeOfApplication"
            legend={t('application-spokes:type-of-application.form-instructions')}
            options={[
              { value: APPLICANT_TYPE.adult, children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:type-of-application.radio-options.personal" />, defaultChecked: defaultState === APPLICANT_TYPE.adult },
              { value: APPLICANT_TYPE.children, children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:type-of-application.radio-options.child" />, defaultChecked: defaultState === APPLICANT_TYPE.children },
              { value: APPLICANT_TYPE.family, children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:type-of-application.radio-options.personal-and-child" />, defaultChecked: defaultState === APPLICANT_TYPE.family },
              { value: APPLICANT_TYPE.delegate, children: <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:type-of-application.radio-options.delegate" />, defaultChecked: defaultState === APPLICANT_TYPE.delegate },
            ]}
            required
            errorMessage={errors?.typeOfApplication}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="save-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Save - Type of application click">
              {t('application-spokes:type-of-application.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="public/application/$id/type-of-application"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Spoke:Back - Type of application click"
            >
              {t('application-spokes:type-of-application.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
