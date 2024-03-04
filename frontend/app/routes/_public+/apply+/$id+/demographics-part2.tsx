import { useEffect, useState } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

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

const i18nNamespaces = getTypedI18nNamespaces('demographics-oral-health-questions', 'gcweb');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-1112',
  pageTitleI18nKey: 'demographics-oral-health-questions:part2.page-title',
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { OTHER_GENDER_TYPE_ID } = getEnv();
  const sexAtBirthTypes = await getLookupService().getAllSexAtBirthTypes();
  const mouthPainTypes = await getLookupService().getAllMouthPaintTypes();
  const lastTimeDentistVisitTypes = await getLookupService().getAllLastTimeDentistVisitTypes();
  const avoidedDentalCostTypes = await getLookupService().getAllAvoidedDentalCostTypes();
  const genderTypes = await getLookupService().getAllGenderTypes();
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const otherGenderCode = genderTypes.find((method) => method.id === OTHER_GENDER_TYPE_ID);
  if (!otherGenderCode) {
    throw new Response('Expected gender type!', { status: 500 });
  }

  return json({ otherGenderCode, genderTypes, sexAtBirthTypes, mouthPainTypes, lastTimeDentistVisitTypes, avoidedDentalCostTypes, id, state: state.demographicsPart2 });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formSchema = z.object({
    genderTypeChoosen: z.string({ required_error: 'empty-radio' }),
    otherGenderField: z.string().min(1, { message: 'empty-field' }).optional(),
    mouthPainType: z.string({ required_error: 'empty-radio' }),
    lastDentalVisitType: z.string({ required_error: 'empty-radio' }),
    avoidedDentalCareDueToCost: z.string({ required_error: 'empty-radio' }),
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
    state: { demographicsPart2: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/review-information`, sessionResponseInit);
}

export default function DemographicsPart2() {
  const { otherGenderCode, genderTypes, mouthPainTypes, lastTimeDentistVisitTypes, avoidedDentalCostTypes, id, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const [otherGenderChecked, setOtherGenderChecked] = useState(state?.genderTypeChoosen === otherGenderCode.id);
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const otherGenderHandler = () => {
    setOtherGenderChecked(true);
  };

  const nonOtherGenderHandler = () => {
    setOtherGenderChecked(false);
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
    return t(`demographics-oral-health-questions:part2.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    genderTypeChoosen: getErrorMessage(actionData?.errors.genderTypeChoosen?._errors[0]),
    otherGenderField: getErrorMessage(actionData?.errors.otherGenderField?._errors[0]),
    mouthPainType: getErrorMessage(actionData?.errors.mouthPainType?._errors[0]),
    lastDentalVisitType: getErrorMessage(actionData?.errors.lastDentalVisitType?._errors[0]),
    avoidedDentalCareDueToCost: getErrorMessage(actionData?.errors.avoidedDentalCareDueToCost?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);
  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  const nonOtherGenderTypeOptions: InputRadiosProps['options'] = genderTypes
    .filter((method) => method.id !== otherGenderCode.id)
    .map((method) => ({
      children: i18n.language === 'fr' ? method.nameFr : method.nameEn,
      value: method.id,
      defaultChecked: state && state.genderTypeChoosen !== otherGenderCode.id,
      onClick: nonOtherGenderHandler,
    }));

  const options: InputRadiosProps['options'] = [
    {
      children: getNameByLanguage(i18n.language, otherGenderCode),
      value: otherGenderCode.id,
      defaultChecked: state?.genderTypeChoosen === otherGenderCode.id,
      append: otherGenderChecked && (
        <div className="mb-4 grid max-w-prose gap-6 md:grid-cols-2 ">
          <InputField
            id="otherGenderField"
            type="text"
            className="w-full"
            label={t('demographics-oral-health-questions:part2.question-gender-other-specify')}
            name="otherGenderFieldName"
            errorMessage={errorMessages.otherGenderField}
            defaultValue={state?.genderInputField}
          />
        </div>
      ),
      onClick: otherGenderHandler,
    },
    ...nonOtherGenderTypeOptions,
  ];

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" className="space-y-6">
        {genderTypes.length > 0 && <InputRadios id="genderTypeChoosen" legend={t('demographics-oral-health-questions:part2.question-gender')} name="genderTypeChoosen" errorMessage={errorMessages.genderTypeChoosen} options={options} required></InputRadios>}

        {mouthPainTypes.length > 0 && (
          <InputRadios
            id="mouthPainType"
            name="mouthPainType"
            legend={t('demographics-oral-health-questions:part2.question-mouth-pain')}
            options={mouthPainTypes.map((mouthPainType) => ({
              children: getNameByLanguage(i18n.language, mouthPainType),
              value: mouthPainType.id,
            }))}
            errorMessage={errorMessages.mouthPainType}
            required
          />
        )}
        {lastTimeDentistVisitTypes.length > 0 && (
          <InputRadios
            id="lastDentalVisitType"
            name="lastDentalVisitType"
            legend={t('demographics-oral-health-questions:part2.question-last-dental-visit')}
            options={lastTimeDentistVisitTypes.map((lastTimeDentistVisitType) => ({
              children: getNameByLanguage(i18n.language, lastTimeDentistVisitType),
              value: lastTimeDentistVisitType.id,
            }))}
            errorMessage={errorMessages.lastDentalVisitType}
            required
          />
        )}
        {avoidedDentalCostTypes.length > 0 && (
          <InputRadios
            id="avoidedDentalCareDueToCost"
            name="avoidedDentalCareDueToCost"
            legend={t('demographics-oral-health-questions:part2.question-avoided-dental-cost')}
            options={avoidedDentalCostTypes.map((avoidedDentalCostType) => ({
              children: getNameByLanguage(i18n.language, avoidedDentalCostType),
              value: avoidedDentalCostType.id,
            }))}
            errorMessage={errorMessages.avoidedDentalCareDueToCost}
            required
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" to={`/apply/${id}/demographics-part1`}>
            {t('demographics-oral-health-questions:part2.button-back')}
          </ButtonLink>
          <Button id="change-button" variant="primary">
            {t('demographics-oral-health-questions:part2.button-continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
