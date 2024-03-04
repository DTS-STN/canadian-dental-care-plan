import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputLegend } from '~/components/input-legend';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('eligibility');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'eligibility:breadcrumbs.canada-ca', to: '/personal-information' },
    { labelI18nKey: 'eligibility:breadcrumbs.benefits' },
    { labelI18nKey: 'eligibility:breadcrumbs.dental-coverage' },
    { labelI18nKey: 'eligibility:breadcrumbs.canadian-dental-care-plan' },
  ],
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

  if (getAgeEligibility(parsedDataResult.data.day, parsedDataResult.data.month, parsedDataResult.data.year)) {
    return redirect(`/apply/${id}/personal-info`, sessionResponseInit);
  }
  return redirect(`/apply/${id}/dob-eligibility`, sessionResponseInit);
}

//Returns true for applicants who are 65 years of age or older
function getAgeEligibility(day: number, month: number, year: number): boolean {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  if (currentYear - year > 65) {
    return true;
  } else if (currentYear - year == 65) {
    if (month < currentMonth) {
      return true;
    } else if (month == currentMonth) {
      if (day <= currentDay) return true;
    }
  }
  return false;
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

  const errorMessages = {
    day: getErrorMessage(actionData?.errors.day?._errors[0]),
    month: getErrorMessage(actionData?.errors.month?._errors[0]),
    year: getErrorMessage(actionData?.errors.year?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ children: new Intl.DateTimeFormat(`${i18n.language}-ca`, { month: 'long' }).format(new Date(2023, i, 1)), value: i, id: `month-${i}` }));

  return (
    <>
      <p className="max-w-prose">{t('date-of-birth.description')}</p>
      <br />
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="max-w-prose">
        <InputLegend id="dobLegend" required={errorSummaryItems.length > 0} className="mb-2">
          {t('date-of-birth.form-instructions')}
        </InputLegend>
        <div className="flex flex-col gap-6 sm:flex-row">
          <InputSelect id="month" label={t('date-of-birth.month')} options={monthOptions} name="month" errorMessage={errorMessages.month} defaultValue={state?.month} />
          <InputField id="day" label={t('date-of-birth.day')} name="day" type="number" min={1} max={31} errorMessage={errorMessages.day} defaultValue={state?.day} />
          <InputField id="year" label={t('date-of-birth.year')} name="year" type="number" min={1900} errorMessage={errorMessages.year} defaultValue={state?.year} />
        </div>
        <br />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink type="button" variant="alternative" to={'/apply/' + id + '/tax-filing'}>
            {t('back-btn')}
            <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
          </ButtonLink>
          <Button type="submit" variant="primary">
            {t('continue-btn')}
            <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
          </Button>
        </div>
      </Form>
    </>
  );
}
