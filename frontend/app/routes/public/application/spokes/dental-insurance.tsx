import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/dental-insurance';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.dentalInsurance,
  pageTitleI18nKey: 'apply-adult:dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:dental-insurance.title') }) };

  return { meta, defaultState: state.dentalInsurance };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z.object({
    dentalInsurance: z.boolean({ error: t('apply-adult:dental-insurance.error-message.dental-insurance-required') }),
  });

  const parsedDataResult = dentalInsuranceSchema.safeParse({
    dentalInsurance: formData.get('dentalInsurance') ? formData.get('dentalInsurance') === 'yes' : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({ params, session, state: { dentalInsurance: parsedDataResult.data.dentalInsurance } });

  // TODO: update with correct route
  return redirect(getPathById('public/application/$id/new-adult/dental-insurance', params));
}

export default function ApplicationSpokeDentalInsurance({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

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

        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton id="continue-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Access to other dental insurance click">
            {t('dental-insurance.button.continue')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId="public/application/$id/new-adult/dental-insurance" // TODO: update with correct route
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Access to other dental insurance click"
          >
            {t('dental-insurance.button.back')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
