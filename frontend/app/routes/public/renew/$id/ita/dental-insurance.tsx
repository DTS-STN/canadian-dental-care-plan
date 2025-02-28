import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadRenewItaState } from '~/.server/routes/helpers/renew-ita-route-helpers';
import { saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
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

const FORM_ACTION = {
  continue: 'continue',
  cancel: 'cancel',
  back: 'back',
  save: 'save',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.dentalInsurance,
  pageTitleI18nKey: 'renew-ita:dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:dental-insurance.title') }) };

  return { id: state, meta, defaultState: state.dentalInsurance, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ errorMap: () => ({ message: t('renew-ita:dental-insurance.error-message.dental-insurance-required') }) }),
  });

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));
  if (formAction === FORM_ACTION.back) {
    if (state.hasAddressChanged) {
      if (state.isHomeAddressSameAsMailingAddress) {
        return redirect(getPathById('public/renew/$id/ita/update-mailing-address', params));
      }
      return redirect(getPathById('public/renew/$id/ita/update-home-address', params));
    }
    if (state.isHomeAddressSameAsMailingAddress) {
      return redirect(getPathById('public/renew/$id/ita/confirm-address', params));
    }
    return redirect(getPathById('public/renew/$id/ita/update-home-address', params));
  }

  const parsedDataResult = dentalInsuranceSchema.safeParse({
    dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({ params, session, state: { dentalInsurance: parsedDataResult.data.dentalInsurance } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/ita/federal-provincial-territorial-benefits', params));
}

export default function RenewItaAccessToDentalInsuranceQuestion({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { dentalInsurance: 'input-radio-dental-insurance-option-0' });

  const helpMessage = (
    <div className="my-4 space-y-4">
      <Collapsible summary={t('dental-insurance.detail.additional-info.title')}>
        <div className="space-y-4">
          <p>{t('dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-4 pl-7">
            <li>{t('dental-insurance.detail.additional-info.eligible-list.employment-benefits')}</li>
            <li>
              {t('dental-insurance.detail.additional-info.eligible-list.organization.professional-student')}
              <p className="pl-4">{t('dental-insurance.detail.additional-info.eligible-list.organization.note')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.not-take')}</li>
                <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.pay-premium')}</li>
                <li>{t('dental-insurance.detail.additional-info.eligible-list.organization.not-use')}</li>
              </ul>
            </li>
            <li>
              {t('dental-insurance.detail.additional-info.eligible-list.pension.pension-benefits')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.federal-provincial-territorial')}</li>
                <li>
                  {t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.eligible')}
                  <ul className="list-disc space-y-1 pl-7">
                    <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opted-out')}</li>
                    <li>{t('dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opt-back')}</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              {t('dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-through')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-privately')}</li>
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
        <Progress value={77} size="lg" label={t('renew:progress.label')} />
      </div>
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
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Save - Access to private dental insurance click">
                {t('dental-insurance.button.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="public/renew/$id/ita/review-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Cancel - Access to private dental insurance click"
              >
                {t('dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                name="_action"
                value={FORM_ACTION.continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Continue - Access to private dental insurance click"
              >
                {t('dental-insurance.button.continue')}
              </LoadingButton>
              <Button id="back-button" name="_action" value={FORM_ACTION.back} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-ITA:Back - Access to private dental insurance click">
                {t('dental-insurance.button.back')}
              </Button>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
