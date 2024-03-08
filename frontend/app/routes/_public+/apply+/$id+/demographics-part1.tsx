import { useEffect, useState } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, MetaFunction, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
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
  const bornTypes = await getLookupService().getAllBornTypes();
  const disabilityTypes = await getLookupService().getAllDisabilityTypes();
  const { OTHER_EQUITY_TYPE_ID } = getEnv();
  const equityTypes = await getLookupService().getAllEquityTypes();
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:demographics-oral-health-questions.part1.page-title') }) };
  const otherEquityCode = equityTypes.find((equityType) => equityType.id === OTHER_EQUITY_TYPE_ID);
  if (!otherEquityCode) {
    throw new Response(`Unexpected 'Other' equity type: ${OTHER_EQUITY_TYPE_ID}`, { status: 500 });
  }
  return json({ id, state, bornTypes, meta, disabilityTypes });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formSchema = z.object({
    bornType: z.string({ required_error: 'empty-radio' }),
    equity: z.string({ required_error: 'empty-radio' }),
    otherEquity: z.string().min(1, { message: 'empty-field' }).optional(),
    disabilityType: z.string({ required_error: 'empty-radio' }),
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

  return redirect(`/apply/${id}/review-information`, sessionResponseInit);
}

export default function DemographicsPart1() {
  const { bornTypes, disabilityTypes, otherEquityCode, equityTypes, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const [otherEquityChecked, setOtherEquityChecked] = useState(state?.equity === otherEquityCode.id);
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  function otherEquityHandler() {
    setOtherEquityChecked(true);
  }

  function nonOtherEquityHandler() {
    setOtherEquityChecked(false);
  }

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
    return t(`demographics-oral-health-questions:part2.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    bornType: getErrorMessage(actionData?.errors.bornType?._errors[0]),
    equity: getErrorMessage(actionData?.errors.equity?._errors[0]),
    disabilityType: getErrorMessage(actionData?.errors.disabilityType?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  const nonOtherEquityTypeOptions: InputRadiosProps['options'] = equityTypes
    .filter((equityType) => equityType.id !== otherEquityCode.id)
    .map((equityType) => ({
      children: getNameByLanguage(i18n.language, equityType),
      value: equityType.id,
      //defaultChecked: state && state.equity !== otherEquityCode.id,
      onClick: nonOtherEquityHandler,
    }));

  const options: InputRadiosProps['options'] = [
    ...nonOtherEquityTypeOptions,
    {
      children: getNameByLanguage(i18n.language, otherEquityCode),
      value: otherEquityCode.id,
      defaultChecked: state?.equity === otherEquityCode.id,
      append: otherEquityChecked && (
        <div className="mb-4 grid max-w-prose gap-6 md:grid-cols-2 ">
          <InputField id="otherEquity" type="text" className="w-full" label={t('demographics-oral-health-questions:part1.question3-other-specify')} name="otherEquityFieldName" defaultValue={state?.otherEquity} />
        </div>
      ),
      onClick: otherEquityHandler,
    },
  ];

  return (
    <>
      <p className="mb-6">{t('apply:demographics-oral-health-questions.part1.paragraph1')}</p>
      <p className="mb-6">{t('apply:demographics-oral-health-questions.part1.paragraph2')}</p>
      <Form method="post">
        {bornTypes.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="born-type"
              name="bornType"
              legend={t('apply:demographics-oral-health-questions.part1.question1')}
              options={bornTypes.map((bornType) => ({
                children: getNameByLanguage(i18n.language, bornType),
                value: bornType.id,
              }))}
              required
            />
          </div>
        )}
        {equityTypes.length > 0 && <InputRadios id="equity" legend={t('demographics-oral-health-questions:part1.question3')} name="equity" errorMessage={errorMessages.equity} options={options} required></InputRadios>}
        {disabilityTypes.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="disability-type"
              name="disabilityType"
              helpMessagePrimary={t('apply:demographics-oral-health-questions.part1.question4-note')}
              legend={t('apply:demographics-oral-health-questions.part1.question4')}
              options={disabilityTypes.map((disabilityType) => ({
                children: getNameByLanguage(i18n.language, disabilityType),
                value: disabilityType.id,
              }))}
              required
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/personal-information">
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
