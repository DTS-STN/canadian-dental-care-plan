import { useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('intake-forms');
export const handle = {
  breadcrumbs: [{ labelI18nKey: 'intake-forms:date-of-birth.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-1122',
  pageTitleI18nKey: 'intake-forms:date-of-birth.page-title',
} as const satisfies RouteHandleData;
export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  return json({ ok: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const dateOfBirthFormSchema = z.object({
    year: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    month: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
    day: z
      .string()
      .min(1, { message: 'empty-field' })
      .transform((val) => val.trim()),
  });
  const formData = Object.fromEntries(await request.formData());

  const dateOfBirth = formData['year'] + '-' + formData['month'] + '-' + formData['day']; //2024-11-14
  const dateSchema = z.coerce.date();
  type DateSchema = z.infer<typeof dateSchema>;
  const dateParsedResult = dateSchema.safeParse(dateOfBirth);

  //const myDateSchema = z.coerce.date();
  if (!dateParsedResult.success) {
    return json({
      errors: 'invalid-date',
      formData: formData as Partial<z.infer<typeof dateOfBirthFormSchema>>,
    });
  }

  //TODO
  //COMPLETE ONCE THE NEXT PAGE IS ADDED

  return redirect('/apply/date-of-birth', {});
}

export default function EnterDoB() {
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';
  const { t } = useTranslation(i18nNamespaces);
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
    return t(`intake-forms:date-of-birth.error-message.${errorI18nKey}` as any);
  }
  const errorMessages = {
    dateOfBirthFieldSet: getErrorMessage(actionData?.errors),
  };
  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post">
        <div>
          <p>{t('intake-forms:date-of-birth.enter-dob-message')}</p>
          <fieldset id="dateOfBirthFieldSet">
            <InputField id="year" label={t('intake-forms:date-of-birth.field.year')} placeholder="YYYY" name="year" required errorMessage={errorMessages.year} maxLength={4} />
            <InputField id="month" label={t('intake-forms:date-of-birth.field.month')} placeholder="MM" name="month" required errorMessage={errorMessages.month} maxLength={2} />
            <InputField id="day" label={t('intake-forms:date-of-birth.field.day')} placeholder="DD" name="day" required errorMessage={errorMessages.day} maxLength={2} />
          </fieldset>
        </div>
        <div>
          <ButtonLink id="back-button" to="/apply/application-type">
            {t('intake-forms:date-of-birth.button-back')}
          </ButtonLink>
          <Button id="confirm-button" variant="primary">
            {t('intake-forms:date-of-birth.button-continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
