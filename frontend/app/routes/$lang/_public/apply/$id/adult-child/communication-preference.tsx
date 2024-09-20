import type { ChangeEventHandler } from 'react';
import { useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import type { CommunicationPreferencesState } from '~/route-helpers/apply-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env-utils.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, getLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { localizeAndSortPreferredLanguages } from '~/utils/lookup-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.communicationPreference,
  pageTitleI18nKey: 'apply-adult-child:communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const { COMMUNICATION_METHOD_EMAIL_ID, ENGLISH_LANGUAGE_CODE, FRENCH_LANGUAGE_CODE } = getEnv();

  const lookupService = getLookupService();
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);
  const preferredLanguages = serviceProvider.getPreferredLanguageService().findAll();
  const localizedAndSortedPreferredLanguages = localizeAndSortPreferredLanguages(preferredLanguages, locale, locale === 'en' ? ENGLISH_LANGUAGE_CODE : FRENCH_LANGUAGE_CODE);
  const preferredCommunicationMethods = lookupService.getAllPreferredCommunicationMethods();

  const communicationMethodEmail = preferredCommunicationMethods.find((method) => method.id === COMMUNICATION_METHOD_EMAIL_ID);
  if (!communicationMethodEmail) {
    throw new Response('Expected communication method email not found!', { status: 500 });
  }

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:communication-preference.page-title') }) };

  return json({
    communicationMethodEmail,
    id: state.id,
    csrfToken,
    meta,
    preferredCommunicationMethods,
    preferredLanguages: localizedAndSortedPreferredLanguages,
    defaultState: {
      ...(state.communicationPreferences ?? {}),
      email: state.communicationPreferences?.email ?? state.contactInformation?.email,
    },
    editMode: state.editMode,
    isReadOnlyEmail: !!state.contactInformation?.email,
  });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/communication-preference');

  const { COMMUNICATION_METHOD_EMAIL_ID } = getEnv();

  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema = z
    .object({
      preferredLanguage: z.string().trim().min(1, t('apply-adult-child:communication-preference.error-message.preferred-language-required')),
      preferredMethod: z.string().trim().min(1, t('apply-adult-child:communication-preference.error-message.preferred-method-required')),
      email: z.string().trim().max(64).optional(),
      confirmEmail: z.string().trim().max(64).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.email-valid'), path: ['email'] });
        }

        if (!state.contactInformation?.email) {
          if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.confirm-email-required'), path: ['confirmEmail'] });
          } else if (!validator.isEmail(val.confirmEmail)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.confirm-email-valid'), path: ['confirmEmail'] });
          } else if (val.email !== val.confirmEmail) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply-adult-child:communication-preference.error-message.email-match'), path: ['confirmEmail'] });
          }
        }
      }
    }) satisfies z.ZodType<CommunicationPreferencesState>;

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail') ?? '') : undefined,
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
  };
  const parsedDataResult = formSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  saveApplyState({ params, session, state: { communicationPreferences: parsedDataResult.data } });

  if (state.editMode) {
    return redirect(getPathById('$lang/_public/apply/$id/adult-child/review-adult-information', params));
  }

  return redirect(getPathById('$lang/_public/apply/$id/adult-child/dental-insurance', params));
}

export default function ApplyFlowCommunicationPreferencePage() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, communicationMethodEmail, preferredLanguages, preferredCommunicationMethods, defaultState, editMode, isReadOnlyEmail } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [preferredMethodValue, setPreferredMethodValue] = useState(defaultState.preferredMethod ?? '');

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    preferredLanguage: 'input-radio-preferred-language-option-0',
    preferredMethod: 'input-radio-preferred-methods-option-0',
    email: 'email',
    confirmEmail: 'confirm-email',
  });

  const handleOnPreferredMethodChecked: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreferredMethodValue(e.target.value);
  };

  const nonEmailOptions: InputRadiosProps['options'] = preferredCommunicationMethods
    .filter((method) => method.id !== communicationMethodEmail.id)
    .map((method) => ({
      children: i18n.language === 'fr' ? method.nameFr : method.nameEn,
      value: method.id,
      defaultChecked: defaultState.preferredMethod === method.id,
      onChange: handleOnPreferredMethodChecked,
    }));

  const options: InputRadiosProps['options'] = [
    {
      children: getNameByLanguage(i18n.language, communicationMethodEmail),
      value: communicationMethodEmail.id,
      defaultChecked: defaultState.preferredMethod === communicationMethodEmail.id,
      append: preferredMethodValue === communicationMethodEmail.id && (
        <div className="mb-6 grid items-end gap-6 md:grid-cols-2">
          <InputField
            id="email"
            type="email"
            inputMode="email"
            className="w-full"
            label={t('apply-adult-child:communication-preference.email')}
            maxLength={64}
            name="email"
            errorMessage={errors?.email}
            autoComplete="email"
            defaultValue={defaultState.email ?? ''}
            required
            readOnly={isReadOnlyEmail}
          />
          {!isReadOnlyEmail && (
            <InputField
              id="confirm-email"
              type="email"
              inputMode="email"
              className="w-full"
              label={t('apply-adult-child:communication-preference.confirm-email')}
              maxLength={64}
              name="confirmEmail"
              errorMessage={errors?.confirmEmail}
              autoComplete="email"
              defaultValue={defaultState.email ?? ''}
              required
            />
          )}
        </div>
      ),
      onChange: handleOnPreferredMethodChecked,
    },
    ...nonEmailOptions,
  ];

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={54} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-6">{t('apply-adult-child:communication-preference.note')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            {preferredLanguages.length > 0 && (
              <InputRadios
                id="preferred-language"
                name="preferredLanguage"
                legend={t('apply-adult-child:communication-preference.preferred-language')}
                options={preferredLanguages.map((language) => ({
                  defaultChecked: defaultState.preferredLanguage === language.id,
                  children: language.name,
                  value: language.id,
                }))}
                errorMessage={errors?.preferredLanguage}
                required
              />
            )}
            {preferredCommunicationMethods.length > 0 && (
              <InputRadios id="preferred-methods" legend={t('apply-adult-child:communication-preference.preferred-method')} name="preferredMethod" options={options} errorMessage={errors?.preferredMethod} required />
            )}
          </div>
          {editMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Save - Communication click">
                {t('apply-adult-child:communication-preference.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="$lang/_public/apply/$id/adult-child/review-adult-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Cancel - Communication click"
              >
                {t('apply-adult-child:communication-preference.cancel-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Communication click">
                {t('apply-adult-child:communication-preference.continue')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="$lang/_public/apply/$id/adult-child/contact-information"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Communication click"
              >
                {t('apply-adult-child:communication-preference.back')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
