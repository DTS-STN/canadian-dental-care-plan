import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { data, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/.server/routes/helpers/protected-renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Continue = 'continue',
  Save = 'save',
  Back = 'back',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'renew', 'gcweb'),
  pageTitleI18nKey: 'protected-renew:dental-insurance.title',
  pageIdentifier: pageIds.protected.renew.dentalInsurance,
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const memberName = `${state.clientApplication.applicantInformation.firstName} ${state.clientApplication.applicantInformation.lastName}`;

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:dental-insurance.title', { memberName }) }) };

  return { id: state, meta, defaultState: state.dentalInsurance, editMode: state.editMode, i18nOptions: { memberName } };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const { ENABLED_FEATURES } = appContainer.get(TYPES.configs.ClientConfig);
  const demographicSurveyEnabled = ENABLED_FEATURES.includes('demographic-survey');

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ errorMap: () => ({ message: t('protected-renew:dental-insurance.error-message.dental-insurance-required') }) }),
  });

  const parsedDataResult = dentalInsuranceSchema.safeParse({
    dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedRenewState({
    params,
    session,
    state: {
      dentalInsurance: parsedDataResult.data.dentalInsurance,
      previouslyReviewed: demographicSurveyEnabled ? undefined : true,
    },
  });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-adult-information', params));
  }

  if (state.clientApplication.isInvitationToApplyClient) {
    return redirect(getPathById('protected/renew/$id/confirm-federal-provincial-territorial-benefits', params));
  }

  if (demographicSurveyEnabled) {
    return redirect(getPathById('protected/renew/$id/demographic-survey', params));
  }

  return redirect(getPathById('protected/renew/$id/member-selection', params));
}

export default function ProtectedRenewAdultChildAccessToDentalInsuranceQuestion() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { dentalInsurance: 'input-radio-dental-insurance-option-0' });

  const helpMessage = (
    <div className="my-4 space-y-4">
      <Collapsible summary={t('dental-insurance.detail.additional-info.title')}>
        <div className="space-y-4">
          <p>{t('dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('dental-insurance.detail.additional-info.eligible-list.employment-benefits')}</li>
            <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.professional-student')}</li>
            <p className="pl-4">{t('dental-insurance.detail.additional-info.eligible-list.organization.note')}</p>
            <ul className="list-disc space-y-1 pl-12">
              <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.not-take')}</li>
              <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.pay-premium')}</li>
              <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.not-use')}</li>
            </ul>
            <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.pension-benefits')}</li>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.federal-provincial-territorial')}</li>
              <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.eligible')}</li>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opted-out')}</li>
                <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opt-back')}</li>
              </ul>
            </ul>
            <li>{t('dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-through')}</li>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-privately')}</li>
            </ul>
          </ul>
        </div>
      </Collapsible>
    </div>
  );

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="my-6">
            <InputRadios
              id="dental-insurance"
              name="dentalInsurance"
              legend={t('dental-insurance.legend')}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-insurance.option-yes" />,
                  value: 'yes',
                  defaultChecked: defaultState === true,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="dental-insurance.option-no" />,
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
              <Button name="_action" value={FormAction.Save} variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Access to other dental insurance click">
                {t('dental-insurance.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Access to other dental insurance click"
              >
                {t('dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Access to other dental insurance click"
              >
                {t('dental-insurance.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/member-selection"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Access to other dental insurance click"
              >
                {t('dental-insurance.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
