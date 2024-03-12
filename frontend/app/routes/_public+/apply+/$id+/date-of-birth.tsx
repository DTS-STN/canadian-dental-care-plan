import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
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
import { yearsBetween } from '~/utils/apply-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:eligibility.date-of-birth.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.date-of-birth.page-title') }) };

  return json({ id, meta, state: state.dob });
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
  return yearsBetween(new Date(), applicantDob) >= 65 ? redirect(`/apply/${id}/applicant-information`, sessionResponseInit) : redirect(`/apply/${id}/dob-eligibility`, sessionResponseInit);
}

export default function ApplyFlowDateOfBirth() {
  const { state } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:eligibility.date-of-birth.error-message.${errorI18nKey}` as any);
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
      <p className="mb-6 mt-6 max-w-prose">{t('apply:eligibility.date-of-birth.description')}</p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" aria-describedby="form-instructions" noValidate className="max-w-prose">
        <InputLegend id="dobLegend" required={errorSummaryItems.length > 0} className="mb-2">
          {t('apply:eligibility.date-of-birth.form-instructions')}
        </InputLegend>
        <div className="flex flex-col gap-6 sm:flex-row">
          <InputSelect id="month" label={t('apply:eligibility.date-of-birth.month')} options={monthOptions} name="month" errorMessage={errorMessages.month} defaultValue={state?.month} />
          <InputField id="day" label={t('apply:eligibility.date-of-birth.day')} name="day" type="number" min={1} max={31} errorMessage={errorMessages.day} defaultValue={state?.day} />
          <InputField id="year" label={t('apply:eligibility.date-of-birth.year')} name="year" type="number" min={1900} errorMessage={errorMessages.year} defaultValue={state?.year} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/apply">
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:eligibility.date-of-birth.back-btn')}
          </ButtonLink>
          <Button variant="primary" id="continue-button">
            {t('apply:eligibility.date-of-birth.continue-btn')}
            <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
          </Button>
        </div>
      </Form>
    </>
  );
}
