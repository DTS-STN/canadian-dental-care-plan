import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('demographics-oral-health-questions', 'gcweb');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-1111',
  pageTitleI18nKey: 'demographics-oral-health-questions:part1.page-title',
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const bornTypes = await getLookupService().getAllBornTypes();
  const disabilityTypes = await getLookupService().getAllDisabilityTypes();
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  return json({ id, state, bornTypes, disabilityTypes });
}

export async function action({ request }: ActionFunctionArgs) {
  return json('');
}

export default function DemographicsPart1() {
  const { bornTypes, disabilityTypes } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p className="mb-6">{t('demographics-oral-health-questions:part1.paragraph1')}</p>
      <p className="mb-6">{t('demographics-oral-health-questions:part1.paragraph2')}</p>
      <Form method="post">
        {bornTypes.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="born-type"
              name="bornType"
              legend={t('demographics-oral-health-questions:part1.question1')}
              options={bornTypes.map((bornType) => ({
                children: getNameByLanguage(i18n.language, bornType),
                value: bornType.id,
              }))}
              required
            />
          </div>
        )}
        {disabilityTypes.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="disability-type"
              name="disabilityType"
              helpMessagePrimary={t('demographics-oral-health-questions:part1.question4-note')}
              legend={t('demographics-oral-health-questions:part1.question4')}
              options={disabilityTypes.map((disabilityType) => ({
                children: getNameByLanguage(i18n.language, disabilityType),
                value: disabilityType.id,
              }))}
              required
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" to="/personal-information">
            {t('demographics-oral-health-questions:part1.button-back')}
          </ButtonLink>
          <Button id="change-button" variant="primary">
            {t('demographics-oral-health-questions:part1.button-continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
