import { ReactNode } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('dental-insurance-question');

export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'dental-insurance-question:title',
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const options = await getLookupService().getAllAccessToDentalInsuranceOptions();
  return json({ id, state, options });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.accessStateSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.accessStateSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { access: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/confirm`, sessionResponseInit);
}

export default function AccessToDentalInsuranceQuestion() {
  const { options, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

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
    <Form method="post">
      {options.length > 0 && (
        <div className="my-6">
          {options.length > 0 && (
            <InputRadios
              id="dental-insurance"
              name="dentalInsurance"
              legend={t('dental-insurance-question:legend')}
              options={options.map((option) => ({
                children: (
                  <div>
                    <strong>{getNameByLanguage(i18n.language, option)}</strong>
                    {`, ${option.id === 'yes' ? t('dental-insurance-question:option1') : t('dental-insurance-question:option2')}`}
                  </div>
                ),
                value: option.id,
                defaultChecked: state.access?.dentalInsurance === option.id,
              }))}
              helpMessagePrimary={helpMessage}
              helpMessagePrimaryClassName="pl-8 text-black"
            />
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to="/apply">
          {t('dental-insurance-question:button.back')}
        </ButtonLink>
        <Button id="continue-button" variant="primary">
          {t('dental-insurance-question:button.continue')}
        </Button>
      </div>
    </Form>
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
