import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('demographics-oral-health-questions', 'gcweb');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-1112',
  pageTitleI18nKey: 'demographics-oral-health-questions:part2.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sexAtBirthTypes = await getLookupService().getAllSexAtBirthTypes();

  return json({ sexAtBirthTypes });
}

export async function action({ request }: ActionFunctionArgs) {
  return json('');
}

export default function DemographicsPart2() {
  const { sexAtBirthTypes } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <Form method="post">
        <div className="my-6">
          {sexAtBirthTypes.length > 0 && (
            <InputRadios
              id="born-type"
              name="bornType"
              legend={t('demographics-oral-health-questions:part2.question6')}
              options={sexAtBirthTypes.map((sexAtBirthType) => ({
                children: getNameByLanguage(i18n.language, sexAtBirthType),
                value: sexAtBirthType.id,
              }))}
              required
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel-button" to="/personal-information">
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
