import { ChangeEventHandler, useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios, InputRadiosProps } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export interface CommunicationPreferencesState {
  confirmEmail?: string;
  confirmEmailForFuture?: string;
  email?: string;
  emailForFuture?: string;
  preferredLanguage: string;
  preferredMethod: string;
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.communicationPreference,
  pageTitleI18nKey: 'apply:communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const { COMMUNICATION_METHOD_EMAIL_ID } = getEnv();
  const applyRouteHelpers = getApplyRouteHelpers();
  const lookupService = getLookupService();
  const { id, state } = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const preferredLanguages = await lookupService.getAllPreferredLanguages();
  const preferredCommunicationMethods = await lookupService.getAllPreferredCommunicationMethods();

  const communicationMethodEmail = preferredCommunicationMethods.find((method) => method.id === COMMUNICATION_METHOD_EMAIL_ID);
  if (!communicationMethodEmail) {
    throw new Response('Expected communication method email not found!', { status: 500 });
  }

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:communication-preference.page-title') }) };

  return json({ communicationMethodEmail, id, csrfToken, meta, preferredCommunicationMethods, preferredLanguages, defaultState: state.communicationPreferences, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/communication-preference');

  const { COMMUNICATION_METHOD_EMAIL_ID } = getEnv();
  const applyRouteHelpers = getApplyRouteHelpers();
  const { id, state } = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formSchema: z.ZodType<CommunicationPreferencesState> = z
    .object({
      preferredLanguage: z.string().trim().min(1, t('apply:communication-preference.error-message.preferred-language-required')),
      preferredMethod: z.string().trim().min(1, t('apply:communication-preference.error-message.preferred-method-required')),
      email: z.string().trim().optional(),
      confirmEmail: z.string().trim().optional(),
      emailForFuture: z.string().trim().optional(),
      confirmEmailForFuture: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID) {
        if (typeof val.email !== 'string' || validator.isEmpty(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.email-required'), path: ['email'] });
        } else if (!validator.isEmail(val.email)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.email-valid'), path: ['email'] });
        }

        if (typeof val.confirmEmail !== 'string' || validator.isEmpty(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.confirm-email-required'), path: ['confirmEmail'] });
        } else if (!validator.isEmail(val.confirmEmail)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.confirm-email-valid'), path: ['confirmEmail'] });
        } else if (val.email !== val.confirmEmail) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.confirm-email-match'), path: ['confirmEmail'] });
        }
      } else {
        const emailForFutureNotEmpty = typeof val.emailForFuture === 'string' && !validator.isEmpty(val.emailForFuture);
        const confirmEmailForFutureNotEmpty = typeof val.confirmEmailForFuture === 'string' && !validator.isEmpty(val.confirmEmailForFuture);

        if (emailForFutureNotEmpty || confirmEmailForFutureNotEmpty) {
          if (!val.emailForFuture || (validator.isEmpty(val.emailForFuture) && val.confirmEmailForFuture)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.email-for-future-required'), path: ['emailForFuture'] });
          } else if (!validator.isEmail(val.emailForFuture)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.email-for-future-valid'), path: ['emailForFuture'] });
          }

          if (!val.confirmEmailForFuture || validator.isEmpty(val.confirmEmailForFuture)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.confirm-email-for-future-required'), path: ['confirmEmailForFuture'] });
          } else if (!validator.isEmail(val.confirmEmailForFuture)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.confirm-email-for-future-required'), path: ['confirmEmailForFuture'] });
          } else if (val.emailForFuture !== val.confirmEmailForFuture) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:communication-preference.error-message.confirm-email-for-future-match'), path: ['confirmEmailForFuture'] });
          }
        }
      }
    });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = {
    confirmEmail: formData.get('confirmEmail') ? String(formData.get('confirmEmail') ?? '') : undefined,
    confirmEmailForFuture: formData.get('confirmEmailForFuture') ? String(formData.get('confirmEmailForFuture') ?? '') : undefined,
    email: formData.get('email') ? String(formData.get('email') ?? '') : undefined,
    emailForFuture: formData.get('emailForFuture') ? String(formData.get('emailForFuture') ?? '') : undefined,
    preferredLanguage: String(formData.get('preferredLanguage') ?? ''),
    preferredMethod: String(formData.get('preferredMethod') ?? ''),
  };
  const parsedDataResult = formSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const sessionResponseInit = await applyRouteHelpers.saveState({ params, request, session, state: { communicationPreferences: parsedDataResult.data } });
  return redirectWithLocale(request, state.editMode ? `/apply/${id}/review-information` : `/apply/${id}/dental-insurance`, sessionResponseInit);
}

export default function ApplyFlowCommunicationPreferencePage() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, id, communicationMethodEmail, preferredLanguages, preferredCommunicationMethods, defaultState, editMode } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [preferredMethodValue, setPreferredMethodValue] = useState(defaultState?.preferredMethod ?? '');
  const errorSummaryId = 'error-summary';

  const handleOnPreferredMethodChecked: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreferredMethodValue(e.target.value);
  };

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-preferred-language-option-0': fetcher.data?.errors.preferredLanguage?._errors[0],
      'input-radio-preferred-methods-option-0': fetcher.data?.errors.preferredMethod?._errors[0],
      email: fetcher.data?.errors.email?._errors[0],
      'confirm-email': fetcher.data?.errors.confirmEmail?._errors[0],
      'email-for-future': fetcher.data?.errors.emailForFuture?._errors[0],
      'confirm-email-for-future': fetcher.data?.errors.confirmEmailForFuture?._errors[0],
    }),
    [
      fetcher.data?.errors.confirmEmail?._errors,
      fetcher.data?.errors.confirmEmailForFuture?._errors,
      fetcher.data?.errors.email?._errors,
      fetcher.data?.errors.emailForFuture?._errors,
      fetcher.data?.errors.preferredLanguage?._errors,
      fetcher.data?.errors.preferredMethod?._errors,
    ],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  const nonEmailOptions: InputRadiosProps['options'] = preferredCommunicationMethods
    .filter((method) => method.id !== communicationMethodEmail.id)
    .map((method) => ({
      children: i18n.language === 'fr' ? method.nameFr : method.nameEn,
      value: method.id,
      defaultChecked: defaultState?.preferredMethod === method.id,
      append: preferredMethodValue === method.id && (
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <p className="md:col-span-2" id="future-email-note">
            {t('apply:communication-preference.future-email-note')}
          </p>
          <InputField id="email-for-future" type="email" className="w-full" label={t('apply:communication-preference.future-email')} name="emailForFuture" errorMessage={errorMessages['email-for-future']} defaultValue={defaultState?.emailForFuture ?? ''} />
          <InputField
            id="confirm-email-for-future"
            type="email"
            className="w-full"
            label={t('apply:communication-preference.future-confirm-email')}
            name="confirmEmailForFuture"
            errorMessage={errorMessages['confirm-email-for-future']}
            defaultValue={defaultState?.confirmEmailForFuture ?? ''}
          />
        </div>
      ),
      onChange: handleOnPreferredMethodChecked,
    }));

  const options: InputRadiosProps['options'] = [
    {
      children: getNameByLanguage(i18n.language, communicationMethodEmail),
      value: communicationMethodEmail.id,
      defaultChecked: defaultState?.preferredMethod === communicationMethodEmail.id,
      append: preferredMethodValue === communicationMethodEmail.id && (
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <p className="md:col-span-2" id="email-note">
            {t('apply:communication-preference.email-note')}
          </p>
          <InputField id="email" type="email" className="w-full" label={t('apply:communication-preference.email')} name="email" errorMessage={errorMessages.email} defaultValue={defaultState?.email ?? ''} required />
          <InputField id="confirm-email" type="email" className="w-full" label={t('apply:communication-preference.confirm-email')} name="confirmEmail" errorMessage={errorMessages['confirm-email']} defaultValue={defaultState?.confirmEmail ?? ''} required />
        </div>
      ),
      onChange: handleOnPreferredMethodChecked,
    },
    ...nonEmailOptions,
  ];

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={70} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <p className="mb-6">{t('apply:communication-preference.note')}</p>
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div className="mb-8 space-y-6">
            {preferredLanguages.length > 0 && (
              <InputRadios
                id="preferred-language"
                name="preferredLanguage"
                legend={t('apply:communication-preference.preferred-language')}
                options={preferredLanguages.map((language) => ({
                  defaultChecked: defaultState?.preferredLanguage === language.id,
                  children: getNameByLanguage(i18n.language, language),
                  value: language.id,
                }))}
                errorMessage={errorMessages['input-radio-preferred-language-option-0']}
                required
              />
            )}
            {preferredCommunicationMethods.length > 0 && (
              <InputRadios id="preferred-methods" legend={t('apply:communication-preference.preferred-method')} name="preferredMethod" options={options} errorMessage={errorMessages['input-radio-preferred-methods-option-0']} required />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {editMode ? (
              <>
                <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                  {t('apply:communication-preference.save-btn')}
                </Button>
                <ButtonLink id="back-button" to={`/apply/${id}/review-information`} disabled={isSubmitting}>
                  {t('apply:communication-preference.cancel-btn')}
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink id="back-button" to={`/apply/${id}/personal-information`} disabled={isSubmitting}>
                  <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                  {t('apply:communication-preference.back')}
                </ButtonLink>
                <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                  {t('apply:communication-preference.continue')}
                  <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
                </Button>
              </>
            )}
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
