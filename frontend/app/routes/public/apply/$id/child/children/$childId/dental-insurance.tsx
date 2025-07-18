import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadApplyChildState, loadApplySingleChildState } from '~/.server/routes/helpers/apply-child-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.childDentalInsurance,
  pageTitleI18nKey: 'apply-child:children.dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  if (!data) {
    return [];
  }

  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplySingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('apply-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('apply-child:children.dental-insurance.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('apply-child:children.dental-insurance.title', { childName: childNumber }) }),
  };

  return { meta, defaultState: state.dentalInsurance, childName, editMode: state.editMode, i18nOptions: { childName } };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplySingleChildState({ params, request, session });
  const applyState = loadApplyChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ errorMap: () => ({ message: t('apply-child:children.dental-insurance.error-message.dental-insurance-required') }) }),
  });

  const dentalInsurance = { dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined };
  const parsedDataResult = dentalInsuranceSchema.safeParse(dentalInsurance);

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveApplyState({
    params,
    session,
    state: {
      children: applyState.children.map((child) => {
        if (child.id !== state.id) return child;
        return { ...child, dentalInsurance: parsedDataResult.data.dentalInsurance };
      }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/child/review-child-information', params));
  }

  return redirect(getPathById('public/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits', params));
}

export default function AccessToDentalInsuranceQuestion({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, childName, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { dentalInsurance: 'input-radio-dental-insurance-option-0' });

  const helpMessage = (
    <div className="my-4 space-y-4">
      <Collapsible summary={t('children.dental-insurance.detail.additional-info.title', { childName })}>
        <div className="space-y-4">
          <p>{t('children.dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('children.dental-insurance.detail.additional-info.list.employer')}</li>
            <li>
              {t('children.dental-insurance.detail.additional-info.list.organization')}
              <p>{t('children.dental-insurance.detail.additional-info.list.organization-note')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('children.dental-insurance.detail.additional-info.list.organization-list.decide')}</li>
                <li>{t('children.dental-insurance.detail.additional-info.list.organization-list.premium')}</li>
                <li>{t('children.dental-insurance.detail.additional-info.list.organization-list.use')}</li>
              </ul>
            </li>
            <li>
              {t('children.dental-insurance.detail.additional-info.list.pension')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('children.dental-insurance.detail.additional-info.list.pension-plans')}</li>
                <li>
                  {t('children.dental-insurance.detail.additional-info.list.pension-exemption')}
                  <ul className="list-disc space-y-1 pl-7">
                    <li>{t('children.dental-insurance.detail.additional-info.list.pension-list.opt-out')}</li>
                    <li>{t('children.dental-insurance.detail.additional-info.list.pension-list.opt-in')}</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              {t('children.dental-insurance.detail.additional-info.list.company')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('children.dental-insurance.detail.additional-info.list.cannot-opt')}</li>
              </ul>
            </li>
          </ul>
        </div>
      </Collapsible>
    </div>
  );

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={30} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="my-6">
            <InputRadios
              id="dental-insurance"
              name="dentalInsurance"
              legend={t('children.dental-insurance.legend', { childName: childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="children.dental-insurance.option-yes" />,
                  value: 'yes',
                  defaultChecked: defaultState === true,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="children.dental-insurance.option-no" />,
                  value: 'no',
                  defaultChecked: defaultState === false,
                },
              ]}
              helpMessagePrimary={helpMessage}
              helpMessagePrimaryClassName="text-black"
              errorMessage={errors?.dentalInsurance}
              required
            />
          </div>
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Save - Child access to other dental insurance click">
                {t('children.dental-insurance.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Cancel - Child access to other dental insurance click"
              >
                {t('children.dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Continue - Child access to other dental insurance click">
                {t('children.dental-insurance.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/child/children/$childId/information"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Child:Back - Child access to other dental insurance click"
              >
                {t('children.dental-insurance.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
