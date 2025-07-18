import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { loadRenewAdultChildState, loadRenewAdultSingleChildState } from '~/.server/routes/helpers/renew-adult-child-route-helpers';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-adult-child', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.adultChild.dentalInsurance,
  pageTitleI18nKey: 'renew-adult-child:children.dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  if (!data) {
    return [];
  }

  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadRenewAdultSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('renew-adult-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.dental-insurance.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('renew-adult-child:children.dental-insurance.title', { childName: childNumber }) }),
  };

  return { meta, defaultState: state.dentalInsurance, childName, editMode: state.editMode, isNew: state.isNew, i18nOptions: { childName } };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const state = loadRenewAdultSingleChildState({ params, request, session });
  const renewState = loadRenewAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ errorMap: () => ({ message: t('renew-adult-child:children.dental-insurance.error-message.dental-insurance-required') }) }),
  });

  const dentalInsurance = { dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined };
  const parsedDataResult = dentalInsuranceSchema.safeParse(dentalInsurance);

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      children: renewState.children.map((child) => {
        if (child.id !== state.id) return child;
        return { ...child, dentalInsurance: parsedDataResult.data.dentalInsurance };
      }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/adult-child/review-child-information', params));
  }

  return redirect(getPathById('public/renew/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits', params));
}

export default function RenewAdultChildChildrenDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, childName, editMode, isNew } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { dentalInsurance: 'input-radio-dental-insurance-option-0' });

  const helpMessage = (
    <div className="my-4 space-y-4">
      <Collapsible summary={t('children.dental-insurance.detail.additional-info.title')}>
        <div className="space-y-4">
          <p>{t('children.dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-4 pl-7">
            <li>{t('children.dental-insurance.detail.additional-info.eligible-list.employment-benefits')}</li>
            <li>
              {t('children.dental-insurance.detail.additional-info.eligible-list.organization.professional-student')}
              <p className="pl-4">{t('children.dental-insurance.detail.additional-info.eligible-list.organization.note')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('children.dental-insurance.detail.additional-info.eligible-list.organization.not-take')}</li>
                <li>{t('children.dental-insurance.detail.additional-info.eligible-list.organization.pay-premium')}</li>
                <li>{t('children.dental-insurance.detail.additional-info.eligible-list.organization.not-use')}</li>
              </ul>
            </li>
            <li>
              {t('children.dental-insurance.detail.additional-info.eligible-list.pension.pension-benefits')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('children.dental-insurance.detail.additional-info.eligible-list.pension.federal-provincial-territorial')}</li>
                <li>
                  {t('children.dental-insurance.detail.additional-info.eligible-list.pension.exceptions.eligible')}
                  <ul className="list-disc space-y-1 pl-7">
                    <li>{t('children.dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opted-out')}</li>
                    <li>{t('children.dental-insurance.detail.additional-info.eligible-list.pension.exceptions.opt-back')}</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              {t('children.dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-through')}
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('children.dental-insurance.detail.additional-info.eligible-list.purchased-coverage.purchased-privately')}</li>
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
        <Progress value={81} size="lg" label={t('renew:progress.label')} />
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
              <Button id="save-button" variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Save - Child access to private dental insurance click">
                {t('children.dental-insurance.button.save-btn')}
              </Button>
              <ButtonLink
                id="cancel-button"
                routeId="public/renew/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Cancel - Child access to private dental insurance click"
              >
                {t('children.dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Continue - Child access to private dental insurance click">
                {t('children.dental-insurance.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId={isNew ? 'public/renew/$id/adult-child/children/$childId/information' : 'public/renew/$id/adult-child/children/index'}
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult_Child:Back - Child access to private dental insurance click"
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
