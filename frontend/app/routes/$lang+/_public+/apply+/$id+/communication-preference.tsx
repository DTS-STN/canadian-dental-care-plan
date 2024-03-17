import { useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios, InputRadiosProps } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.communicationPreference,
  pageTitleI18nKey: 'apply:communication-preference.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { COMMUNICATION_METHOD_EMAIL_ID } = getEnv();
  const lookupService = getLookupService();
  const preferredLanguages = await lookupService.getAllPreferredLanguages();
  const preferredCommunicationMethods = await lookupService.getAllPreferredCommunicationMethods();

  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const communicationMethodEmail = preferredCommunicationMethods.find((method) => method.id === COMMUNICATION_METHOD_EMAIL_ID);
  if (!communicationMethodEmail) {
    throw new Response('Expected communication method email not found!', { status: 500 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:communication-preference.page-title') }) };

  return json({ communicationMethodEmail, id, meta, preferredCommunicationMethods, preferredLanguages, state: state.communicationPreferences });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { COMMUNICATION_METHOD_EMAIL_ID } = getEnv();
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const emailsMatch = (email: string | undefined, confirmEmail: string | undefined) => {
    if (!email || !confirmEmail) {
      // if either email is omitted, skip the matching
      // check and render 'please enter a value'
      return true;
    }

    return email.trim() === confirmEmail.trim();
  };

  const isEmpty = (value: string | undefined) => {
    if (!value) {
      return true;
    }
    return !value.trim();
  };

  const formSchema = z
    .object({
      preferredLanguage: z.string({ required_error: 'empty-language' }),
      preferredMethod: z.string({ required_error: 'empty-method' }),
      email: z.string().min(1, { message: 'empty-email' }).email({ message: 'invalid-email' }).optional(),
      confirmEmail: z.string().min(1, { message: 'empty-confirm-email' }).optional(),
      emailForFuture: z.preprocess((arg) => (arg === '' ? undefined : arg), z.string().email({ message: 'invalid-email' }).optional()),
      confirmEmailForFuture: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.preferredMethod === COMMUNICATION_METHOD_EMAIL_ID) {
        if (!emailsMatch(val.email, val.confirmEmail)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'not-the-same',
            path: ['confirmEmail'],
          });
        }
      } else {
        if (val.emailForFuture && isEmpty(val.confirmEmailForFuture)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'empty-confirm-email',
            path: ['confirmEmailForFuture'],
          });
        }
        if (isEmpty(val.emailForFuture) && val.confirmEmailForFuture) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'empty-email',
            path: ['emailForFuture'],
          });
        }
        if (!emailsMatch(val.emailForFuture, val.confirmEmailForFuture)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'not-the-same',
            path: ['confirmEmailForFuture'],
          });
        }
      }
    });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { communicationPreferences: parsedDataResult.data },
  });

  return redirectWithLocale(request, `/apply/${id}/dental-insurance`, sessionResponseInit);
}

export default function ApplyFlowCommunicationPreferencePage() {
  const { id, communicationMethodEmail, preferredLanguages, preferredCommunicationMethods, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const [emailMethodChecked, setEmailMethodChecked] = useState(state?.preferredMethod === communicationMethodEmail.id);
  const [nonEmailMethodChecked, setNonEmailMethodChecked] = useState(state && state.preferredMethod !== communicationMethodEmail.id);
  const fetcher = useFetcher<typeof action>();

  const errorSummaryId = 'error-summary';

  const emailMethodHandler = () => {
    setEmailMethodChecked(true);
    setNonEmailMethodChecked(false);
  };

  const nonEmailMethodHandler = () => {
    setEmailMethodChecked(false);
    setNonEmailMethodChecked(true);
  };

  /**
   * Gets an error message based on the provided internationalization (i18n) key.
   *
   * @param errorI18nKey - The i18n key for the error message.
   * @returns The corresponding error message, or undefined if no key is provided.
   */
  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;

    /**
     * The 'as any' is employed to circumvent typechecking, as the type of
     * 'errorI18nKey' is a string, and the string literal cannot undergo validation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:communication-preference.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    preferredLanguage: getErrorMessage(fetcher.data?.errors.preferredLanguage?._errors[0]),
    preferredMethod: getErrorMessage(fetcher.data?.errors.preferredMethod?._errors[0]),
    email: getErrorMessage(fetcher.data?.errors.email?._errors[0]),
    confirmEmail: getErrorMessage(fetcher.data?.errors.confirmEmail?._errors[0]),
    emailForFuture: getErrorMessage(fetcher.data?.errors.emailForFuture?._errors[0]),
    confirmEmailForFuture: getErrorMessage(fetcher.data?.errors.confirmEmailForFuture?._errors[0]),
    sameEmail: getErrorMessage(fetcher.data?.errors._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (fetcher.data?.formData && hasErrors(fetcher.data.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  const nonEmailOptions: InputRadiosProps['options'] = preferredCommunicationMethods
    .filter((method) => method.id !== communicationMethodEmail.id)
    .map((method) => ({
      children: i18n.language === 'fr' ? method.nameFr : method.nameEn,
      value: method.id,
      defaultChecked: state && state.preferredMethod !== communicationMethodEmail.id,
      append: nonEmailMethodChecked && (
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <p className="col-span-2" id="future-email-note">
            {t('apply:communication-preference.future-email-note')}
          </p>
          <InputField id="emailForFuture" type="email" className="w-full" label={t('apply:communication-preference.future-email')} name="emailForFuture" errorMessage={errorMessages.emailForFuture} defaultValue={state?.emailForFuture} />
          <InputField
            id="confirmEmailForFuture"
            type="email"
            className="w-full"
            label={t('apply:communication-preference.future-confirm-email')}
            name="confirmEmailForFuture"
            errorMessage={errorMessages.confirmEmailForFuture ?? errorMessages.sameEmail}
            defaultValue={state?.confirmEmailForFuture}
          />
        </div>
      ),
      onClick: nonEmailMethodHandler,
    }));

  const options: InputRadiosProps['options'] = [
    {
      children: getNameByLanguage(i18n.language, communicationMethodEmail),
      value: communicationMethodEmail.id,
      defaultChecked: state?.preferredMethod === communicationMethodEmail.id,
      append: emailMethodChecked && (
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <InputField id="email" type="email" className="w-full" label={t('apply:communication-preference.email')} name="email" errorMessage={errorMessages.email} defaultValue={state?.email} />
          <InputField id="confirmEmail" type="email" className="w-full" label={t('apply:communication-preference.confirm-email')} name="confirmEmail" errorMessage={errorMessages.confirmEmail ?? errorMessages.sameEmail} defaultValue={state?.confirmEmail} />
        </div>
      ),
      onClick: emailMethodHandler,
    },
    ...nonEmailOptions,
  ];

  return (
    <div className="max-w-prose">
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <p className="mb-6">{t('apply:communication-preference.note')}</p>
      <fetcher.Form method="post" noValidate>
        <div className="mb-8 space-y-6">
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('apply:communication-preference.preferred-language')}
              options={preferredLanguages.map((language) => ({
                defaultChecked: state?.preferredLanguage === language.id,
                children: getNameByLanguage(i18n.language, language),
                value: language.id,
              }))}
              errorMessage={errorMessages.preferredLanguage}
              required
            />
          )}
          {preferredCommunicationMethods.length > 0 && <InputRadios id="preferred-methods" legend={t('apply:communication-preference.preferred-method')} name="preferredMethod" options={options} errorMessage={errorMessages.preferredMethod} required />}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={`/apply/${id}/personal-information`} disabled={fetcher.state !== 'idle'}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:communication-preference.back')}
          </ButtonLink>
          <Button variant="primary" id="continue-button" disabled={fetcher.state !== 'idle'}>
            {t('apply:communication-preference.continue')}
            <FontAwesomeIcon icon={fetcher.state !== 'idle' ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', fetcher.state !== 'idle' && 'animate-spin')} />
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
