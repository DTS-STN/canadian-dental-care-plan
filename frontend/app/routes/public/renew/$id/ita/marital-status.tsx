import type { ChangeEventHandler } from 'react';
import { useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { TYPES } from '~/.server/constants';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputPatternField } from '~/components/input-pattern-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadRenewItaState } from '~/route-helpers/renew-ita-route-helpers.server';
import type { PartnerInformationState } from '~/route-helpers/renew-route-helpers.server';
import { renewStateHasPartner, saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.maritalStatus,
  pageTitleI18nKey: 'renew-ita:marital-status.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const maritalStatuses = appContainer.get(TYPES.MARITAL_STATUS_SERVICE).listLocalizedMaritalStatuses(locale);
  const { MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED } = appContainer.get(TYPES.SERVER_CONFIG);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:marital-status.page-title') }) };

  return json({ csrfToken, defaultState: { maritalStatus: state.maritalStatus, ...state.partnerInformation }, editMode: state.editMode, id: state.id, maritalStatuses, meta, MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED });
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/ita/marital-status');

  const state = loadRenewItaState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  // state validation schema
  const maritalStatusSchema = z.object({
    maritalStatus: z
      .string({ errorMap: () => ({ message: t('renew-ita:marital-status.error-message.marital-status-required') }) })
      .trim()
      .min(1, t('renew-ita:marital-status.error-message.marital-status-required')),
  });

  const currentYear = new Date().getFullYear().toString();
  const partnerInformationSchema = z.object({
    confirm: z.boolean().refine((val) => val === true, t('renew-ita:marital-status.error-message.confirm-required')),
    yearOfBirth: z
      .string()
      .trim()
      .min(1, t('renew-ita:marital-status.error-message.date-of-birth-year-required'))
      .refine((year) => year < currentYear, t('renew-ita:marital-status.error-message.yob-is-future')),
    socialInsuranceNumber: z
      .string()
      .trim()
      .min(1, t('renew-ita:marital-status.error-message.sin-required'))
      .refine(isValidSin, t('renew-ita:marital-status.error-message.sin-valid'))
      .refine((sin) => isValidSin(sin) && formatSin(sin, '') !== state.partnerInformation?.socialInsuranceNumber, t('renew-ita:marital-status.error-message.sin-unique')),
  }) satisfies z.ZodType<PartnerInformationState>;

  const maritalStatusData = {
    maritalStatus: formData.get('maritalStatus') ? String(formData.get('maritalStatus')) : undefined,
  };
  const partnerInformationData = {
    confirm: formData.get('confirm') === 'yes',
    yearOfBirth: String(formData.get('yearOfBirth') ?? ''),
    socialInsuranceNumber: String(formData.get('socialInsuranceNumber') ?? ''),
  };

  const parsedMaritalStatus = maritalStatusSchema.safeParse(maritalStatusData);
  const parsedPartnerInformation = partnerInformationSchema.safeParse(partnerInformationData);

  if (!parsedMaritalStatus.success || (renewStateHasPartner(parsedMaritalStatus.data.maritalStatus) && !parsedPartnerInformation.success)) {
    return json({
      errors: {
        ...(parsedMaritalStatus.error ? transformFlattenedError(parsedMaritalStatus.error.flatten()) : {}),
        ...(parsedMaritalStatus.success && renewStateHasPartner(parsedMaritalStatus.data.maritalStatus) && parsedPartnerInformation.error ? transformFlattenedError(parsedPartnerInformation.error.flatten()) : {}),
      },
    });
  }

  saveRenewState({ params, session, state: { maritalStatus: parsedMaritalStatus.data.maritalStatus, partnerInformation: parsedPartnerInformation.data } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/ita/confirm-phone', params));
}

export default function RenewItaMaritalStatus() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode, maritalStatuses, MARITAL_STATUS_CODE_COMMONLAW, MARITAL_STATUS_CODE_MARRIED } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const [marriedOrCommonlaw, setMarriedOrCommonlaw] = useState(defaultState.maritalStatus);

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    maritalStatus: 'input-radio-marital-status-option-0',
    yearOfBirth: 'year-of-birth',
    socialInsuranceNumber: 'social-insurance-number',
    confirm: 'input-checkbox-confirm',
  });

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setMarriedOrCommonlaw(e.target.value);
  };

  const maritalStatusOptions = useMemo<InputRadiosProps['options']>(() => {
    return maritalStatuses.map((status) => ({ defaultChecked: status.id === defaultState.maritalStatus, children: status.name, value: status.id, onChange: handleChange }));
  }, [defaultState, maritalStatuses]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={44} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            <InputRadios id="marital-status" name="maritalStatus" legend={t('renew-ita:marital-status.marital-status')} options={maritalStatusOptions} errorMessage={errors?.maritalStatus} required />

            {(marriedOrCommonlaw === MARITAL_STATUS_CODE_COMMONLAW.toString() || marriedOrCommonlaw === MARITAL_STATUS_CODE_MARRIED.toString()) && (
              <>
                <h2 className="mb-6 font-lato text-2xl font-bold">{t('renew-ita:marital-status.spouse-or-commonlaw')}</h2>
                <p className="mb-4">{t('renew-ita:marital-status.provide-sin')}</p>
                <p className="mb-6">{t('renew-ita:marital-status.required-information')}</p>
                <InputPatternField id="year-of-birth" name="yearOfBirth" inputMode="numeric" format="####" defaultValue={defaultState.yearOfBirth ?? ''} label={t('renew-ita:marital-status.year-of-birth')} errorMessage={errors?.yearOfBirth} required />
                <InputPatternField
                  id="social-insurance-number"
                  name="socialInsuranceNumber"
                  format={sinInputPatternFormat}
                  label={t('marital-status.sin')}
                  inputMode="numeric"
                  helpMessagePrimary={t('renew-ita:marital-status.help-message.sin')}
                  helpMessagePrimaryClassName="text-black"
                  defaultValue={defaultState.socialInsuranceNumber ?? ''}
                  errorMessage={errors?.socialInsuranceNumber}
                  required
                />
                <InputCheckbox id="confirm" name="confirm" value="yes" errorMessage={errors?.confirm} defaultChecked={defaultState.confirm === true} required>
                  {t('renew-ita:marital-status.confirm-checkbox')}
                </InputCheckbox>
              </>
            )}
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Marital status click">
                {t('renew-ita:marital-status.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Marital status click">
                {t('renew-ita:marital-status.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                id="continue-button"
                name="_action"
                value={FormAction.Continue}
                variant="primary"
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Marital status click"
              >
                {t('renew-ita:marital-status.continue-btn')}
              </LoadingButton>
              <ButtonLink id="back-button" routeId="public/renew/$id/type-renewal" params={params} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Marital status click">
                {t('renew-ita:marital-status.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
