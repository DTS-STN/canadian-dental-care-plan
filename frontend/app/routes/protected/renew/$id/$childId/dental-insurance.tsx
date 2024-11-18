import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect, useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { loadProtectedRenewSingleChildState, loadProtectedRenewState, saveProtectedRenewState } from '~/route-helpers/protected-renew-route-helpers.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.dentalInsurance,
  pageTitleI18nKey: 'protected-renew:children.dental-insurance.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title, data.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const state = loadProtectedRenewSingleChildState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('protected-renew:children.child-number', { childNumber: state.childNumber });
  const childName = state.firstName ?? childNumber;

  const csrfToken = String(session.get('csrfToken'));
  const meta = {
    title: t('gcweb:meta.title.template', { title: t('protected-renew:children.dental-insurance.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('protected-renew:children.dental-insurance.title', { childName: childNumber }) }),
  };

  return { csrfToken, meta, defaultState: state.dentalInsurance, childName, editMode: state.editMode, i18nOptions: { childName } };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('protected/renew/protected-renew:children/dental-insurance');

  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  const state = loadProtectedRenewSingleChildState({ params, session });
  const protectedRenewState = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ errorMap: () => ({ message: t('protected-renew:children.dental-insurance.error-message.dental-insurance-required') }) }),
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
    return Response.json(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({
    params,
    session,
    state: {
      children: protectedRenewState.children.map((child) => {
        if (child.id !== state.id) return child;
        return { ...child, dentalInsurance: parsedDataResult.data.dentalInsurance };
      }),
    },
  });

  if (state.editMode) {
    return redirect(getPathById('protected/renew/$id/review-child-information', params));
  }

  return redirect(getPathById('protected/renew/$id/$childId/demographic-survey', params));
}

export default function ProtectedRenewChildrenDentalInsurance() {
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
        <li>{t('protected-renew:children.dental-insurance.list.employment')}</li>
        <li>{t('protected-renew:children.dental-insurance.list.pension')}</li>
        <li>{t('protected-renew:children.dental-insurance.list.purchased')}</li>
        <li>{t('protected-renew:children.dental-insurance.list.professional')}</li>
      </ul>
      <Collapsible summary={t('protected-renew:children.dental-insurance.detail.additional-info.title')}>
        <div className="space-y-4">
          <p>{t('protected-renew:children.dental-insurance.detail.additional-info.eligible')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('protected-renew:children.dental-insurance.detail.additional-info.eligible-list.employer')}</li>
            <li>{t('protected-renew:children.dental-insurance.detail.additional-info.eligible-list.pension')}</li>
            <li>{t('protected-renew:children.dental-insurance.detail.additional-info.eligible-list.professional')}</li>
          </ul>
          <p>{t('protected-renew:children.dental-insurance.detail.additional-info.not-eligible')}</p>
          <p>{t('protected-renew:children.dental-insurance.detail.additional-info.not-eligible-purchased')}</p>
          <p>{t('protected-renew:children.dental-insurance.detail.additional-info.excepton')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('protected-renew:children.dental-insurance.detail.additional-info.exception-list.opted-out')}</li>
            <li>{t('protected-renew:children.dental-insurance.detail.additional-info.exception-list.opt-back')}</li>
          </ul>
        </div>
      </Collapsible>
    </div>
  );

  return (
    <>
      <div className="max-w-prose">
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="my-6">
            <InputRadios
              id="dental-insurance"
              name="dentalInsurance"
              legend={t('protected-renew:children.dental-insurance.legend', { childName: childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:children.dental-insurance.option-yes" />,
                  value: 'yes',
                  defaultChecked: defaultState === true,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:children.dental-insurance.option-no" />,
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
              <Button variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application:Save - Child access to other dental insurance click">
                {t('protected-renew:children.dental-insurance.button.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/review-child-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renew Application:Cancel - Child access to other dental insurance click"
              >
                {t('protected-renew:children.dental-insurance.button.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Child access to other dental insurance click">
                {t('protected-renew:children.dental-insurance.button.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="protected/renew/$id/$childId/parent-or-guardian"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Child access to other dental insurance click"
              >
                {t('protected-renew:children.dental-insurance.button.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}