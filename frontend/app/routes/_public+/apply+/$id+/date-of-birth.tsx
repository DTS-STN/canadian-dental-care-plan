import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { DatePicker } from '~/components/date-picker';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { yearsBetween } from '~/utils/apply-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('eligibility');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'eligibility:date-of-birth.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  return json({ id, state: state.dob });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.dobSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.dobSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { dob: parsedDataResult.data },
  });
  const applicantDob = new Date(parsedDataResult.data.year, parsedDataResult.data.month, parsedDataResult.data.day);
  return yearsBetween(new Date(), applicantDob) >= 65 ? redirect(`/apply/${id}/personal-info`, sessionResponseInit) : redirect(`/apply/${id}/dob-eligibility`, sessionResponseInit);
}

export default function ApplyFlowDateOfBirth() {
  const { id, state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const { i18n, t } = useTranslation(i18nNamespaces);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`eligibility:date-of-birth.error-message.${errorI18nKey}` as any);
  }

  console.log(actionData?.errors);
  const errorMessages = {
    day: getErrorMessage(actionData?.errors.day?._errors[0]),
    month: getErrorMessage(actionData?.errors.month?._errors[0]),
    year: getErrorMessage(actionData?.errors.year?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  return (
    <>
      <p className="mb-6 mt-6 max-w-prose">{t('date-of-birth.description')}</p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="max-w-prose">
        <DatePicker
          id="date-of-birth"
          lang={i18n.language}
          legend={t('date-of-birth.form-instructions')}
          monthLabel={t('date-of-birth.month')}
          dayLabel={t('date-of-birth.day')}
          yearLabel={t('date-of-birth.year')}
          monthDefault={state?.month}
          dayDefault={state?.day}
          yearDefault={state?.year}
          errorMessageMonth={errorMessages.month}
          errorMessageDay={errorMessages.day}
          errorMessageYear={errorMessages.year}
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink type="button" variant="alternative" to={`/apply/${id}/tax-filing`}>
            {t('date-of-birth.back-btn')}
            <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
          </ButtonLink>
          <Button type="submit" variant="primary">
            {t('date-of-birth.continue-btn')}
            <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
          </Button>
        </div>
      </Form>
    </>
  );
}
