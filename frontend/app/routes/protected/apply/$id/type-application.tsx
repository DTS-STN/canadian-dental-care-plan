import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/type-application';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const APPLICANT_TYPE = { adult: 'adult', adultChild: 'adult-child', child: 'child', delegate: 'delegate' } as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.typeOfApplication,
  pageTitleI18nKey: 'protected-apply:type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply:type-of-application.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.apply.type-application', { userId: idToken.sub });

  return { meta, defaultState: state.typeOfApplication };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  loadProtectedApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfApplicationSchema = z.object({ typeOfApplication: z.nativeEnum(APPLICANT_TYPE, { errorMap: () => ({ message: t('protected-apply:type-of-application.error-message.type-of-application-required') }) }) });

  const parsedDataResult = typeOfApplicationSchema.safeParse({ typeOfApplication: String(formData.get('typeOfApplication') ?? '') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedApplyState({ params, session, state: { editMode: false, typeOfApplication: parsedDataResult.data.typeOfApplication } });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('update-data.apply.type-application', { userId: idToken.sub });

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.adult) {
    return redirect(getPathById('protected/apply/$id/adult/applicant-information', params));
  }

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.adultChild) {
    return redirect(getPathById('protected/apply/$id/adult-child/applicant-information', params));
  }

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.child) {
    return redirect(getPathById('protected/apply/$id/child/children/index', params));
  }

  return redirect(getPathById('protected/apply/$id/application-delegate', params));
}

export default function ProtectedApplyFlowTypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { typeOfApplication: 'input-radio-type-of-application-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={20} size="lg" label={t('protected-apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mt-8 mb-4 italic">{t('protected-apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="type-of-application"
            name="typeOfApplication"
            legend={t('protected-apply:type-of-application.form-instructions')}
            options={[
              { value: APPLICANT_TYPE.adult, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:type-of-application.radio-options.personal" />, defaultChecked: defaultState === APPLICANT_TYPE.adult },
              { value: APPLICANT_TYPE.child, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:type-of-application.radio-options.child" />, defaultChecked: defaultState === APPLICANT_TYPE.child },
              { value: APPLICANT_TYPE.adultChild, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:type-of-application.radio-options.personal-and-child" />, defaultChecked: defaultState === APPLICANT_TYPE.adultChild },
              { value: APPLICANT_TYPE.delegate, children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:type-of-application.radio-options.delegate" />, defaultChecked: defaultState === APPLICANT_TYPE.delegate },
            ]}
            required
            errorMessage={errors?.typeOfApplication}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Continue - Type of application click">
              {t('protected-apply:type-of-application.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="protected/apply/$id/tax-filing"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Back - Type of application click"
            >
              {t('protected-apply:type-of-application.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
