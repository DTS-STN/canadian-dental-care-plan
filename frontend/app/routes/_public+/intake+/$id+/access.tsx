import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('access-question');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'access-question:title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const bornTypes = await getLookupService().getAllBornTypes();
  return json({ bornTypes });
}

export async function action({ request }: ActionFunctionArgs) {
  return json('');
}

export default function DemographicsPart1() {
  const { bornTypes } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <Form method="post">
        <p className="mb-8 text-lg">{t('access-question:content1')}</p>
        <ul>
          <ol>{t('access-question:list-item1')}</ol>
          <ol>{t('access-question:list-item2')}</ol>
          <ol>{t('access-question:list-item3')}</ol>
        </ul>
        <div className="my-6">
          {bornTypes.length > 0 && (
            <InputRadios
              id="born-type"
              name="bornType"
              legend=""
              options={bornTypes.map((bornType) => ({
                children: getNameByLanguage(i18n.language, bornType),
                value: bornType.id,
              }))}
              required
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" to="/personal-information">
            {t('access-question:button.back')}
          </ButtonLink>
          <Button id="change-button" variant="primary">
            {t('access-question:button.continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}
