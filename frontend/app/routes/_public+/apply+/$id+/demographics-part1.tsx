import { useEffect, useState } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputCheckboxes, InputCheckboxesProps } from '~/components/input-checkboxes';
import { InputField } from '~/components/input-field';
import { InputRadios, InputRadiosProps } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-1111',
  pageTitleI18nKey: 'apply:demographics-oral-health-questions.part1.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { FIRST_NATIONS_YES_TYPE_ID, OTHER_EQUITY_TYPE_ID } = getEnv();
  const bornTypes = await getLookupService().getAllBornTypes();
  const disabilityTypes = await getLookupService().getAllDisabilityTypes();
  const equityTypes = await getLookupService().getAllEquityTypes();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:demographics-oral-health-questions.part1.page-title') }) };

  const otherEquityCode = equityTypes.find((equityType) => equityType.id === OTHER_EQUITY_TYPE_ID);
  if (!otherEquityCode) {
    throw new Response(`Unexpected 'Other' equity type: ${OTHER_EQUITY_TYPE_ID}`, { status: 500 });
  }

  const indigenousTypes = await getLookupService().getAllIndigenousTypes();
  const indigenousGroup = await getLookupService().getAllIndigenousGroupTypes();
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const indigenousYesCode = indigenousTypes.find((indigenousType) => indigenousType.id === FIRST_NATIONS_YES_TYPE_ID);
  if (!indigenousYesCode) {
    throw new Response(`Unexpected 'Yes' indigenous type: ${FIRST_NATIONS_YES_TYPE_ID}`, { status: 500 });
  }

  return json({ id, meta, state: state.demographicsPart1, bornTypes, disabilityTypes, otherEquityCode, equityTypes, indigenousTypes, indigenousGroup, indigenousYesCode });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formSchema = z.object({
    bornType: z.string().trim().optional(),
    indigenousGroup: z.string().trim().optional(),
    indigenousType: z.string().trim().optional(),
    disabilityType: z.string().trim().optional(),
    otherEquity: z.string().trim().min(1, { message: 'empty-field' }).optional(),
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
    state: { demographicsPart1: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/demographics-part2`, sessionResponseInit); //TODO SAVE THE VALUES OF ALL CHECKBOXES
}

export default function DemographicsPart1() {
  const { bornTypes, disabilityTypes, otherEquityCode, equityTypes, indigenousTypes, indigenousGroup, indigenousYesCode, state, id } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  const [otherEquityChecked, setOtherEquityChecked] = useState(state?.otherEquity === otherEquityCode.id);
  const [firstNationsYesChecked, setFirstNationsYesChecked] = useState(state?.indigenousType === indigenousYesCode.id);
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const nonFirstNationsTypeOptions: InputRadiosProps['options'] = indigenousTypes
    .filter((indigenousType) => indigenousType.id !== indigenousYesCode.id)
    .map((indigenousType) => ({
      children: getNameByLanguage(i18n.language, indigenousType),
      value: indigenousType.id,
      defaultChecked: state?.indigenousType === indigenousType.id,
      onClick: () => setFirstNationsYesChecked(false),
    }));

  const indigenousOptions: InputRadiosProps['options'] = [
    {
      children: getNameByLanguage(i18n.language, indigenousYesCode),
      value: indigenousYesCode.id,
      defaultChecked: state?.indigenousType === indigenousYesCode.id,
      append: firstNationsYesChecked && (
        <InputCheckboxes
          id="indigenousGroup"
          name="indigenousGroup"
          legend={t('apply:demographics-oral-health-questions.part1.first-nations-specify')}
          options={indigenousGroup.map((indigenousGroupMember) => ({
            children: getNameByLanguage(i18n.language, indigenousGroupMember),
            value: indigenousGroupMember.id,
            id: indigenousGroupMember.id,
          }))}
        />
      ),
      onClick: () => setFirstNationsYesChecked(true),
    },
    ...nonFirstNationsTypeOptions,
  ];

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
    return t(`demographics-oral-health-questions:part1.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    equity: getErrorMessage(actionData?.errors.otherEquity?._errors[0]),
    bornType: getErrorMessage(actionData?.errors.bornType?._errors[0]),
    firstNations: getErrorMessage(actionData?.errors.indigenousType?._errors[0]),
    disability: getErrorMessage(actionData?.errors.disabilityType?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  const nonOtherEquityTypeOptions: InputCheckboxesProps['options'] = equityTypes
    .filter((equityType) => equityType.id !== otherEquityCode.id)
    .map((equityType) => ({
      children: getNameByLanguage(i18n.language, equityType),
      value: equityType.id,
      id: equityType.id,
    }));

  const equityOptions: InputCheckboxesProps['options'] = [
    ...nonOtherEquityTypeOptions,
    {
      children: getNameByLanguage(i18n.language, otherEquityCode),
      value: otherEquityCode.id,
      defaultChecked: state?.otherEquity === otherEquityCode.id,
      append: otherEquityChecked && (
        <div className="mb-4 grid max-w-prose gap-6 md:grid-cols-2 ">
          <InputField id="otherEquity" type="text" className="w-full" label={t('apply:demographics-oral-health-questions.part1.question3-other-specify')} name="otherEquityFieldName" defaultValue={state?.otherEquity} />
        </div>
      ),
      onClick: () => setOtherEquityChecked((checked) => !checked),
    },
  ];

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <p className="mb-6">{t('apply:demographics-oral-health-questions.part1.paragraph1')}</p>
      <p className="mb-6">{t('apply:demographics-oral-health-questions.part1.paragraph2')}</p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" noValidate className="space-y-6">
        {bornTypes.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="bornType"
              name="bornType"
              legend={t('apply:demographics-oral-health-questions.part1.question1')}
              options={bornTypes.map((bornType) => ({
                defaultChecked: state?.bornType === bornType.id,
                children: getNameByLanguage(i18n.language, bornType),
                value: bornType.id,
              }))}
            />
          </div>
        )}

        {indigenousTypes.length > 0 && <InputRadios id="indigenousType" legend={t('apply:demographics-oral-health-questions.part1.first-nations')} name="indigenousType" options={indigenousOptions} required />}

        {equityTypes.length > 0 && <InputCheckboxes id="equity" legend={t('demographics-oral-health-questions.part1.question3')} name="equity" errorMessage={errorMessages.equity} options={equityOptions} required />}

        {disabilityTypes.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="disabilityType"
              name="disabilityType"
              helpMessagePrimary={t('apply:demographics-oral-health-questions.part1.question4-note')}
              legend={t('apply:demographics-oral-health-questions.part1.question4')}
              options={disabilityTypes.map((disabilityType) => ({
                defaultChecked: state?.disabilityType === disabilityType.id,
                children: getNameByLanguage(i18n.language, disabilityType),
                value: disabilityType.id,
              }))}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to={`/apply/${id}/demographics`}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('apply:demographics-oral-health-questions.part1.button-back')}
          </ButtonLink>
          <Button variant="primary" id="continue-button">
            {t('apply:demographics-oral-health-questions.part1.button-continue')}
            <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
          </Button>
        </div>
      </Form>
    </>
  );
}
