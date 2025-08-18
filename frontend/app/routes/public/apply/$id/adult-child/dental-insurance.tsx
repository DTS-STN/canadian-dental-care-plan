import { data, redirect, useFetcher } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';
import { PREFERRED_NOTIFICATION_METHOD, PREFERRED_SUN_LIFE_METHOD } from './communication-preference';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultChildState } from '~/.server/routes/helpers/apply-adult-child-route-helpers';
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
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.dentalInsurance,
  pageTitleI18nKey: 'apply-adult-child:dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:dental-insurance.title') }) };

  invariant(state.communicationPreferences, 'Expected state.communicationPreferences to be defined');
  const backToEmail = state.communicationPreferences.preferredMethod === PREFERRED_SUN_LIFE_METHOD.email || state.communicationPreferences.preferredNotificationMethod !== PREFERRED_NOTIFICATION_METHOD.mail;

  return { meta, defaultState: state.dentalInsurance, backToEmail, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ error: t('apply-adult-child:dental-insurance.error-message.dental-insurance-required') }),
  });

  const dentalInsurance = { dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined };
  const parsedDataResult = dentalInsuranceSchema.safeParse(dentalInsurance);

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  saveApplyState({ params, session, state: { dentalInsurance: parsedDataResult.data.dentalInsurance } });

  if (state.editMode) {
    return redirect(getPathById('public/apply/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
}

export default function AccessToDentalInsuranceQuestion({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, backToEmail, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    dentalInsurance: 'input-radio-dental-insurance-option-0',
  });

  const helpMessage = (
    <div className="my-4 space-y-4">
      <Collapsible summary={t('dental-insurance.detail.additional-info.title')}>
        <div className="space-y-4">
          <p>{t('dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('dental-insurance.detail.additional-info.list.employer')}</li>
            <li>
              {t('dental-insurance.detail.additional-info.list.organization')}
              <p>{t('dental-insurance.detail.additional-info.list.organization-note')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.list.organization-list.decide')}</li>
                <li>{t('dental-insurance.detail.additional-info.list.organization-list.premium')}</li>
                <li>{t('dental-insurance.detail.additional-info.list.organization-list.use')}</li>
              </ul>
            </li>
            <li>
              {t('dental-insurance.detail.additional-info.list.pension')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.list.pension-plans')}</li>
                <li>
                  {t('dental-insurance.detail.additional-info.list.pension-exemption')}
                  <ul className="list-disc space-y-1 pl-7">
                    <li>{t('dental-insurance.detail.additional-info.list.pension-list.opt-out')}</li>
                    <li>{t('dental-insurance.detail.additional-info.list.pension-list.opt-in')}</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              {t('dental-insurance.detail.additional-info.list.company')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.list.cannot-opt')}</li>
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
        <Progress value={68} size="lg" label={t('apply:progress.label')} />
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
              <Button variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Access to other dental insurance click">
                {t('dental-insurance.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Access to other dental insurance click"
              >
                {t('dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Access to other dental insurance click">
                {t('dental-insurance.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={backToEmail ? 'public/apply/$id/adult-child/email' : 'public/apply/$id/adult-child/communication-preference'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Access to other dental insurance click"
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
