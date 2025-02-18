import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/type-application';

import { TYPES } from '~/.server/constants';
import { loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
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

export const handle = { i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'), pageIdentifier: pageIds.public.apply.typeOfApplication, pageTitleI18nKey: 'apply:type-of-application.page-title' } as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:type-of-application.page-title') }) };

  return { id: state.id, meta, defaultState: state.typeOfApplication };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfApplicationSchema = z.object({ typeOfApplication: z.nativeEnum(APPLICANT_TYPE, { errorMap: () => ({ message: t('apply:type-of-application.error-message.type-of-application-required') }) }) });

  const parsedDataResult = typeOfApplicationSchema.safeParse({ typeOfApplication: String(formData.get('typeOfApplication') ?? '') });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveApplyState({ params, session, state: { editMode: false, typeOfApplication: parsedDataResult.data.typeOfApplication } });

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.adult) {
    return redirect(getPathById('public/apply/$id/adult/date-of-birth', params));
  }

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.adultChild) {
    return redirect(getPathById('public/apply/$id/adult-child/date-of-birth', params));
  }

  if (parsedDataResult.data.typeOfApplication === APPLICANT_TYPE.child) {
    return redirect(getPathById('public/apply/$id/child/applicant-information', params));
  }

  return redirect(getPathById('public/apply/$id/application-delegate', params));
}

export default function ApplyFlowTypeOfApplication({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { typeOfApplication: 'input-radio-type-of-application-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={10} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-6">{t('apply:type-of-application.page-description')}</p>
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="font-lato text-lg font-bold">{t('apply:type-of-application.apply-self')}</h2>
            <p>{t('apply:type-of-application.apply-self-eligibility')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:type-of-application.senior')}</li>
              <li>{t('apply:type-of-application.valid-disability-tax-credit')}</li>
              <li>{t('apply:type-of-application.live-independently')}</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-lg font-bold">{t('apply:type-of-application.apply-child')}</h2>
            <p>{t('apply:type-of-application.apply-child-eligibility')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:type-of-application.sixteen-or-older')}</li>
              <li>{t('apply:type-of-application.under-eighteen')}</li>
            </ul>
            <Collapsible summary={t('apply:type-of-application.split-custody-summary')}>
              <div className="space-y-4">
                <p>{t('apply:type-of-application.multiple-application')}</p>
                <p>{t('apply:type-of-application.split-custody-detail')}</p>
              </div>
            </Collapsible>
          </section>
        </div>
        <p className="mt-8 mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="type-of-application"
            name="typeOfApplication"
            legend={t('apply:type-of-application.form-instructions')}
            options={[
              { value: APPLICANT_TYPE.adult, children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.personal" />, defaultChecked: defaultState === APPLICANT_TYPE.adult },
              { value: APPLICANT_TYPE.child, children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.child" />, defaultChecked: defaultState === APPLICANT_TYPE.child },
              { value: APPLICANT_TYPE.adultChild, children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.personal-and-child" />, defaultChecked: defaultState === APPLICANT_TYPE.adultChild },
              { value: APPLICANT_TYPE.delegate, children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.delegate" />, defaultChecked: defaultState === APPLICANT_TYPE.delegate },
            ]}
            required
            errorMessage={errors?.typeOfApplication}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Type of application click">
              {t('apply:type-of-application.continue-btn')}
            </LoadingButton>
            <ButtonLink id="back-button" routeId="public/apply/$id/tax-filing" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Type of application click">
              {t('apply:type-of-application.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
