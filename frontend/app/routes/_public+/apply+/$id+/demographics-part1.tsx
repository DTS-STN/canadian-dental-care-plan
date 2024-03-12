import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
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
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:demographics-oral-health-questions.part1.page-title') }) };

  return json({ bornTypes, disabilityTypes, id, meta, state });
}

export async function action({ request }: ActionFunctionArgs) {
  return json('');
}

export default function DemographicsPart1() {
  const { bornTypes, disabilityTypes } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

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
