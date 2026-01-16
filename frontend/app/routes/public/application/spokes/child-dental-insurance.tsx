import { useState } from 'react';

import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/child-dental-insurance';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, getSingleChildState, savePublicApplicationState, validateApplicationTypeAndFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { ContextualAlert } from '~/components/contextual-alert';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const CHECKBOX_VALUE = {
  yes: 'yes',
} as const;

const HAS_DENTAL_INSURANCE_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.childDentalInsurance,
  pageTitleI18nKey: 'application-spokes:children.dental-insurance.title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => {
  return getTitleMetaTags(loaderData.meta.title, loaderData.meta.dcTermsTitle);
});

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-children', 'new-family']);
  const childState = getSingleChildState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const childNumber = t('application-spokes:children.child-number', { childNumber: childState.childNumber });
  const childName = childState.information?.firstName ?? childNumber;

  const meta = {
    title: t('gcweb:meta.title.template', { title: t('application-spokes:children.dental-insurance.title', { childName }) }),
    dcTermsTitle: t('gcweb:meta.title.template', { title: t('application-spokes:children.dental-insurance.title', { childName: childNumber }) }),
  };

  return { meta, defaultState: childState.dentalInsurance, childName, i18nOptions: { childName }, typeAndFlow: `${state.typeOfApplication}-${state.typeOfApplicationFlow}` };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationTypeAndFlow(state, params, ['new-children', 'new-family']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const childState = getSingleChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalInsuranceSchema = z
    .object({
      hasDentalInsurance: z.boolean({ error: t('application-spokes:children.dental-insurance.error-message.dental-insurance-required') }),
      dentalInsuranceEligibilityConfirmation: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.hasDentalInsurance && !val.dentalInsuranceEligibilityConfirmation) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:children.dental-insurance.error-message.dental-insurance-eligibility-confirmation-required'), path: ['dentalInsuranceEligibilityConfirmation'] });
      }
    })
    .transform((val) => ({
      ...val,
      dentalInsuranceEligibilityConfirmation: val.hasDentalInsurance ? val.dentalInsuranceEligibilityConfirmation === CHECKBOX_VALUE.yes : undefined,
    }));

  const parsedDataResult = dentalInsuranceSchema.safeParse({
    hasDentalInsurance: formData.get('hasDentalInsurance') ? formData.get('hasDentalInsurance') === 'yes' : undefined,
    dentalInsuranceEligibilityConfirmation: formData.get('dentalInsuranceEligibilityConfirmation') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({
    params,
    session,
    state: {
      children: state.children.map((child) => {
        if (child.id !== childState.id) return child;
        return { ...child, dentalInsurance: parsedDataResult.data };
      }),
    },
  });

  return redirect(getPathById(`public/application/$id/${state.typeOfApplication}-${state.typeOfApplicationFlow}/childrens-application`, params));
}

export default function AccessToDentalInsuranceQuestion({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, childName, typeAndFlow } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { hasDentalInsurance: 'input-radio-dental-insurance-option-0' });

  const [hasDentalInsurance, setHasDentalInsurance] = useState(defaultState?.hasDentalInsurance);

  function handleOnHasDentalInsuranceChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setHasDentalInsurance(e.target.value === HAS_DENTAL_INSURANCE_OPTION.yes);
  }

  const helpMessage = (
    <div className="mb-4 space-y-4">
      <ul className="list-disc space-y-1 pl-7">
        <li>{t('children.dental-insurance.detail.additional-info.list.employer')}</li>
        <li>{t('children.dental-insurance.detail.additional-info.list.pension')}</li>
        <li>{t('children.dental-insurance.detail.additional-info.list.organization')}</li>
        <li>{t('children.dental-insurance.detail.additional-info.list.private')}</li>
      </ul>
      <p>{t('children.dental-insurance.detail.additional-info.eligible')}</p>
      <p>{t('children.dental-insurance.detail.additional-info.access')}</p>
    </div>
  );

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('application:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <div className="my-6">
            <InputRadios
              id="has-dental-insurance"
              name="hasDentalInsurance"
              legend={t('children.dental-insurance.legend', { childName: childName })}
              options={[
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="children.dental-insurance.option-yes" />,
                  value: HAS_DENTAL_INSURANCE_OPTION.yes,
                  defaultChecked: defaultState?.hasDentalInsurance === true,
                  onChange: handleOnHasDentalInsuranceChanged,
                },
                {
                  children: <Trans ns={handle.i18nNamespaces} i18nKey="children.dental-insurance.option-no" />,
                  value: HAS_DENTAL_INSURANCE_OPTION.no,
                  defaultChecked: defaultState?.hasDentalInsurance === false,
                  onChange: handleOnHasDentalInsuranceChanged,
                },
              ]}
              helpMessagePrimary={helpMessage}
              helpMessagePrimaryClassName="text-black"
              errorMessage={errors?.hasDentalInsurance}
              required
            />
          </div>
          {hasDentalInsurance && (
            <div className="space-y-4">
              <ContextualAlert type="info">
                <h3 className="font-lato mb-2 text-xl font-semibold">{t('children.dental-insurance.alert.title')}</h3>
                <p>{t('children.dental-insurance.alert.body', { childName: childName })}</p>
              </ContextualAlert>
              <InputCheckbox
                id="dental-insurance-eligibility-confirmation"
                name="dentalInsuranceEligibilityConfirmation"
                value={CHECKBOX_VALUE.yes}
                defaultChecked={defaultState?.dentalInsuranceEligibilityConfirmation}
                errorMessage={errors?.dentalInsuranceEligibilityConfirmation}
                required
              >
                {t('children.dental-insurance.dental-insurance-eligibility-confirmation', { childName: childName })}
              </InputCheckbox>
            </div>
          )}
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton id="save-button" variant="primary" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Child access to other dental insurance click">
              {t('children.dental-insurance.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId={`public/application/$id/${typeAndFlow}/childrens-application`}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Child access to other dental insurance click"
            >
              {t('children.dental-insurance.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
