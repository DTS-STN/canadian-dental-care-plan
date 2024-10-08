import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputPhoneField } from '~/components/input-phone-field';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadRenewState, saveRenewState } from '~/route-helpers/renew-route-helpers.server';
import type { ContactInformationState } from '~/route-helpers/renew-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum FormAction {
  Continue = 'continue',
  Cancel = 'cancel',
  Save = 'save',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew-ita', 'renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.ita.contactInformation,
  pageTitleI18nKey: 'renew-ita:contact-information.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew-ita:contact-information.page-title') }) };

  return json({
    id: state.id,
    csrfToken,
    meta,
    defaultState: state.contactInformation,
    maritalStatus: state.maritalStatus,
    editMode: state.editMode,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('renew/ita/contact-information');

  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const personalInformationSchema = z
    .object({
      phoneNumber: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-ita:contact-information.error-message.phone-number-valid'))
        .optional(),
      phoneNumberAlt: z
        .string()
        .trim()
        .max(100)
        .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('renew-ita:contact-information.error-message.phone-number-alt-valid'))
        .optional(),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.email ?? val.confirmEmail) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:contact-information.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:contact-information.error-message.email-valid'), path: ['email'] });
        }

        if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:contact-information.error-message.confirm-email-required'), path: ['confirmEmail'] });
        } else if (!validator.isEmail(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:contact-information.error-message.confirm-email-valid'), path: ['confirmEmail'] });
        } else if (val.email !== val.confirmEmail) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('renew-ita:contact-information.error-message.email-match'), path: ['confirmEmail'] });
        }
      }
    })
    .transform((val) => ({
      ...val,
      phoneNumber: val.phoneNumber ? parsePhoneNumber(val.phoneNumber, 'CA').formatInternational() : val.phoneNumber,
      phoneNumberAlt: val.phoneNumberAlt ? parsePhoneNumber(val.phoneNumberAlt, 'CA').formatInternational() : val.phoneNumberAlt,
    })) satisfies z.ZodType<ContactInformationState>;

  const formData = await request.formData();

  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    phoneNumber: formData.get('phoneNumber') ? String(formData.get('phoneNumber')) : undefined,
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
    email: formData.get('email') ? String(formData.get('email')) : undefined,
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail')) : undefined,
  };
  const parsedDataResult = personalInformationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  saveRenewState({ params, session, state: { contactInformation: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('public/renew/$id/ita/review-information', params));
  }

  return redirect(getPathById('public/renew/$id/ita/communication-preference', params));
}

export default function RenewFlowContactInformation() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
    email: 'email',
    confirmEmail: 'confirm-email',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={45} size="lg" label={t('renew:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 italic">{t('renew:optional-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-ita:contact-information.phone-header')}</legend>
            <p className="mb-4" id="adding-phone">
              {t('renew-ita:contact-information.add-phone')}
            </p>
            <div className="grid items-end gap-6">
              <InputPhoneField
                id="phone-number"
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                className="w-full"
                autoComplete="tel"
                defaultValue={defaultState?.phoneNumber ?? ''}
                errorMessage={errors?.phoneNumber}
                label={t('renew-ita:contact-information.phone-number')}
                maxLength={100}
                aria-describedby="adding-phone"
              />
              <InputPhoneField
                id="phone-number-alt"
                name="phoneNumberAlt"
                type="tel"
                inputMode="tel"
                className="w-full"
                autoComplete="tel"
                defaultValue={defaultState?.phoneNumberAlt ?? ''}
                errorMessage={errors?.phoneNumberAlt}
                label={t('renew-ita:contact-information.phone-number-alt')}
                maxLength={100}
                aria-describedby="adding-phone"
              />
            </div>
          </fieldset>
          <fieldset className="mb-6">
            <legend className="mb-4 font-lato text-2xl font-bold">{t('renew-ita:contact-information.email-header')}</legend>
            <p id="adding-email" className="mb-4">
              {t('renew-ita:contact-information.add-email')}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <InputField
                id="email"
                name="email"
                type="email"
                inputMode="email"
                className="w-full"
                autoComplete="email"
                defaultValue={defaultState?.email ?? ''}
                errorMessage={errors?.email}
                label={t('renew-ita:contact-information.email')}
                maxLength={64}
                aria-describedby="adding-email"
              />
              <InputField
                id="confirm-email"
                name="confirmEmail"
                type="email"
                inputMode="email"
                className="w-full"
                autoComplete="email"
                defaultValue={defaultState?.email ?? ''}
                errorMessage={errors?.confirmEmail}
                label={t('renew-ita:contact-information.confirm-email')}
                maxLength={64}
                aria-describedby="adding-email"
              />
            </div>
          </fieldset>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FormAction.Save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Save - Contact information click">
                {t('renew-ita:contact-information.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FormAction.Cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Cancel - Contact information click">
                {t('renew-ita:contact-information.cancel-btn')}
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
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Continue - Contact information click"
              >
                {t('renew-ita:contact-information.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/renew/$id/ita/marital-status"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Contact information click"
              >
                {t('renew-ita:contact-information.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
