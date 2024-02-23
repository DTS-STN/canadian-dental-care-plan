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
  breadcrumbs: [{ labelI18nKey: 'intake-forms:applicant-information.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-1122',
  pageTitleI18nKey: 'intake-forms:applicant-information.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  return json({ ok: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  return '';
}
export default function EnterApplicantInformation() {
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <Form method="post">
        <InputField id="sinNumber" label={t('intake-forms:applicant-information.social-insurance-number')} placeholder="xxx-xxx-xxx" name="social-insurance-number" required maxLength={11} />

        <fieldset id="dateOfBirthFieldSet">
          <legend>{t('intake-forms:applicant-information.date-of-birth')}</legend>
          <InputField id="year" label={t('intake-forms:applicant-information.field.year')} placeholder="YYYY" name="year" required maxLength={4} />
          <InputField id="month" label={t('intake-forms:applicant-information.field.month')} placeholder="MM" name="month" required maxLength={2} />
          <InputField id="day" label={t('intake-forms:applicant-information.field.day')} placeholder="DD" name="day" required maxLength={2} />
        </fieldset>

        <InputField id="lastName" label={t('intake-forms:applicant-information.last-name')} name="lastName" required />
        <InputField id="firstName" label={t('intake-forms:applicant-information.first-name')} name="firstName" required />
      </Form>
    </>
  );
}
