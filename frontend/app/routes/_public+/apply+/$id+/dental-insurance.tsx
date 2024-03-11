import { ReactNode } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'apply:dental-insurance-question.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('apply:dental-insurance-question.title') }) }];
});

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
  const parsedDataResult = applyFlow.dentalInsuranceStateSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.dentalInsuranceStateSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { dentalInsurance: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/confirm`, sessionResponseInit);
}

export default function AccessToDentalInsuranceQuestion() {
  const { options, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  const helpMessage = (
    <>
      <ul className="mb-4 list-disc">
        <li>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:dental-insurance-question.list.employer" />
        </li>
        <li>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:dental-insurance-question.list.pension" />
        </li>
        <li>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:dental-insurance-question.list.dental-coverage" />
        </li>
        <li className="list-none">
          <Details id={t('apply:dental-insurance-question.detail.additional-info.title')} title={t('apply:dental-insurance-question.detail.additional-info.title')}>
            <div>
              <p>{t('apply:dental-insurance-question.detail.additional-info.eligible')}</p>
              <ul className="mb-4 list-disc pl-6">
                <li>{t('apply:dental-insurance-question.detail.additional-info.list.opted')}</li>
                <li>{t('apply:dental-insurance-question.detail.additional-info.list.cannot-opt')}</li>
              </ul>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:dental-insurance-question.detail.additional-info.not-eligible" />
            </div>
          </Details>
        </li>
      </ul>
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
              legend={t('apply:dental-insurance-question.legend')}
              options={options.map((option) => ({
                children: (
                  <div>
                    <strong>{getNameByLanguage(i18n.language, option)}</strong>
                    {`, ${option.id === 'yes' ? t('apply:dental-insurance-question.option-yes') : t('apply:dental-insurance-question.option-no')}`}
                  </div>
                ),
                value: option.id,
                defaultChecked: state.dentalInsurance?.dentalInsurance === option.id,
              }))}
              helpMessagePrimary={helpMessage}
              helpMessagePrimaryClassName="pl-8 text-black"
            />
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to="/apply">
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply:dental-insurance-question.button.back')}
        </ButtonLink>
        <Button variant="primary" id="continue-button">
          {t('apply:dental-insurance-question.button.continue')}
          <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
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
