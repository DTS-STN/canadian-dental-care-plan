import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { loadApplyAdultChildState, loadApplyAdultSingleChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.dentalInsurance,
  pageTitleI18nKey: 'apply-adult-child:children.dental-insurance.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('apply-adult-child:children.child-number', { childNumber: state.childNumber });
  const childName = state.information?.firstName ?? childNumber;

  const csrfToken = String(session.get('csrfToken'));
  const meta = {
    title: t('gcweb:meta.title.template', { title: t('apply-adult-child:children.dental-insurance.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('apply-adult-child:children.dental-insurance.title', { childName: childNumber }) }),
  };

  return json({ csrfToken, meta, defaultState: state.dentalInsurance, childName, editMode: state.editMode, i18nOptions: { childName } });
}

export async function action({ context: { appContainer, serviceProvider, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/children/dental-insurance');

  const state = loadApplyAdultSingleChildState({ params, request, session });
  const applyState = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ errorMap: () => ({ message: t('apply-adult-child:children.dental-insurance.error-message.dental-insurance-required') }) }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const dentalInsurance = { dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined };
  const parsedDataResult = dentalInsuranceSchema.safeParse(dentalInsurance);

  if (!parsedDataResult.success) {
    return json({
      errors: transformFlattenedError(parsedDataResult.error.flatten()),
    });
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
    return redirect(getPathById('public/apply/$id/adult-child/review-child-information', params));
  }

  return redirect(getPathById('public/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits', params));
}

export default function AccessToDentalInsuranceQuestion() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, childName, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { dentalInsurance: 'input-radio-dental-insurance-option-0' });

  const helpMessage = (
    <div className="my-4 space-y-4">
      <ul className="list-disc space-y-1 pl-7">
        <li>{t('children.dental-insurance.list.employment')}</li>
        <li>{t('children.dental-insurance.list.pension')}</li>
        <li>{t('children.dental-insurance.list.purchased')}</li>
        <li>{t('children.dental-insurance.list.professional')}</li>
      </ul>
      <Collapsible summary={t('children.dental-insurance.detail.additional-info.title')}>
        <div className="space-y-4">
          <p>{t('children.dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('children.dental-insurance.detail.additional-info.eligible-list.employer')}</li>
            <li>{t('children.dental-insurance.detail.additional-info.eligible-list.pension')}</li>
            <li>{t('children.dental-insurance.detail.additional-info.eligible-list.professional')}</li>
          </ul>
          <p>{t('children.dental-insurance.detail.additional-info.not-eligible')}</p>
          <p>{t('children.dental-insurance.detail.additional-info.not-eligible-purchased')}</p>
          <p>{t('children.dental-insurance.detail.additional-info.excepton')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('children.dental-insurance.detail.additional-info.exception-list.opted-out')}</li>
            <li>{t('children.dental-insurance.detail.additional-info.exception-list.opt-back')}</li>
          </ul>
        </div>
      </Collapsible>
    </div>
  );

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
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
              <Button variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Child access to other dental insurance click">
                {t('children.dental-insurance.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Child access to other dental insurance click"
              >
                {t('children.dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Child access to other dental insurance click">
                {t('children.dental-insurance.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult-child/children/$childId/information"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Child access to other dental insurance click"
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
