import { useState } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
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
    throw new Response('Expected communication method email not found!', { status: 500 });
  }

  return json({ otherGenderCode, genderTypes, sexAtBirthTypes, mouthPainTypes, lastTimeDentistVisitTypes, avoidedDentalCostTypes, id, state: state.genderType });
}

export async function action({ request }: ActionFunctionArgs) {
  const { OTHER_GENDER_TYPE_ID } = getEnv();
  return json('');
}

export default function DemographicsPart2() {
  const { otherGenderCode, genderTypes, sexAtBirthTypes, mouthPainTypes, lastTimeDentistVisitTypes, avoidedDentalCostTypes, id, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const [otherGenderChecked, setOtherGenderChecked] = useState(state?.genderTypeChoosen === otherGenderCode.id);

  const otherGenderHandler = () => {
    setOtherGenderChecked(true);
  };

  const nonOtherGenderHandler = () => {
    setOtherGenderChecked(false);
  };

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
          <InputField id="otherGenderField" type="text" className="w-full" label={t('demographics-oral-health-questions:part2.question-gender-other-specify')} name="otherGenderFieldName" defaultValue={state?.genderTypeChoosen} />
        </div>
      ),
      onClick: otherGenderHandler,
    },
    ...nonOtherGenderTypeOptions,
  ];

  return (
    <Form method="post" className="space-y-6">
      {genderTypes.length > 0 && <InputRadios id="gender-type" legend={t('demographics-oral-health-questions:part2.question-gender')} name="preferredMethod" options={options} required></InputRadios>}

      {sexAtBirthTypes.length > 0 && (
        <InputRadios
          id="born-type"
          name="bornType"
          legend={t('demographics-oral-health-questions:part2.question-sex-at-birth')}
          options={sexAtBirthTypes.map((sexAtBirthType) => ({
            children: getNameByLanguage(i18n.language, sexAtBirthType),
            value: sexAtBirthType.id,
          }))}
          required
        />
      )}
      {mouthPainTypes.length > 0 && (
        <InputRadios
          id="mouth-pain-type"
          name="mouthPainType"
          legend={t('demographics-oral-health-questions:part2.question-mouth-pain')}
          options={mouthPainTypes.map((mouthPainType) => ({
            children: getNameByLanguage(i18n.language, mouthPainType),
            value: mouthPainType.id,
          }))}
          required
        />
      )}
      {lastTimeDentistVisitTypes.length > 0 && (
        <InputRadios
          id="last-time-dentist-visit-type"
          name="lastTimeDentistVisitType"
          legend={t('demographics-oral-health-questions:part2.question-last-dental-visit')}
          options={lastTimeDentistVisitTypes.map((lastTimeDentistVisitType) => ({
            children: getNameByLanguage(i18n.language, lastTimeDentistVisitType),
            value: lastTimeDentistVisitType.id,
          }))}
          required
        />
      )}
      {avoidedDentalCostTypes.length > 0 && (
        <InputRadios
          id="avoided-dental-cost-type"
          name="avoidedDentalCostType"
          legend={t('demographics-oral-health-questions:part2.question-avoided-dental-cost')}
          options={avoidedDentalCostTypes.map((avoidedDentalCostType) => ({
            children: getNameByLanguage(i18n.language, avoidedDentalCostType),
            value: avoidedDentalCostType.id,
          }))}
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
  );
}
