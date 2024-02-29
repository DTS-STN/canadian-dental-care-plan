import { ReactNode } from 'react';

import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('dental-insurance-question');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'dental-insurance-question:title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: fetch mock here
  const options = ['Yes, I have access to dental insurance', 'No, I do not have access to dental insurance'];
  return json({ options });
}

export async function action({ request }: ActionFunctionArgs) {
  // TODO: send data to api
  return json('');
}

export default function AccessQuestion() {
  const { options } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  const helpMessage = (
    <>
      <ul className="mb-4 list-disc">
        <li>{t('dental-insurance-question:list-item1')}</li>
        <li>
          {t('dental-insurance-question:list-item2')}
          <Details id={t('dental-insurance-question:detail.exception.title')} title={t('dental-insurance-question:detail.exception.title')}>
            <div>
              <p>{t('dental-insurance-question:detail.exception.content')}</p>
              <ul className="list-disc pl-6">
                <li>{t('dental-insurance-question:detail.exception.list-item1')}</li>
                <li>{t('dental-insurance-question:detail.exception.list-item2')}</li>
              </ul>
            </div>
          </Details>
        </li>
        <li>
          {t('dental-insurance-question:list-item3')}
          <Details id={t('dental-insurance-question:detail.note.title')} title={t('dental-insurance-question:detail.note.title')}>
            <p>{t('dental-insurance-question:detail.note.content')}</p>
          </Details>
        </li>
        <li>{t('dental-insurance-question:list-item4')}</li>
      </ul>
      <p className="mb-4">{t('dental-insurance-question:content2')}</p>
    </>
  );

  return (
    <>
      <Form method="post">
        <div className="my-6">
          {options.length > 0 && (
            <InputRadios
              id="born-type"
              name="bornType"
              legend={t('dental-insurance-question:legend')}
              options={options.map((option) => ({
                children: option,
                value: option,
              }))}
              helpMessagePrimary={helpMessage}
              helpMessagePrimaryClassName="pl-8 text-[#333333]"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" to="/intake">
            {t('dental-insurance-question:button.back')}
          </ButtonLink>
          <Button id="continue-button" variant="primary">
            {t('dental-insurance-question:button.continue')}
          </Button>
        </div>
      </Form>
    </>
  );
}

interface DetailsProps {
  id: string;
  title: string;
  children: ReactNode;
}

// TODO: Temporary, will be replaced by reusable component
function Details({ id, title, children }: DetailsProps) {
  return (
    <details id={id} className="mt-6">
      <summary className="mb-2 text-blue-700">
        <p className="-mt-6 ml-6 underline">{title}</p>
      </summary>
      <div className="border-l-4 border-gray-400 py-4 pl-4">{children}</div>
    </details>
  );
}
