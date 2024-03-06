import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('provincial-territorial');

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

  return (
    <Form method="post">
      <Trans ns={i18nNamespaces} i18nKey="provincial-territorial:main-content" />
      {options.length > 0 && (
        <div className="my-6">
          {options.length > 0 && (
            <InputRadios
              id="dental-insurance"
              name="dentalInsurance"
              legend={t('provincial-territorial:federal-benefit.legend')}
              options={options.map((option) => ({
                children: (
                  <div>
                    <strong>{getNameByLanguage(i18n.language, option)}</strong>
                    {`, ${option.id === 'yes' ? t('provincial-territorial:provincial-territorial.option-yes') : t('provincial-territorial:provincial-territorial.option-no')}`}
                  </div>
                ),
                value: option.id,
                defaultChecked: state.access?.dentalInsurance === option.id,
              }))}
            />
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to="/apply">
          {t('provincial-territorial:button.back')}
        </ButtonLink>
        <Button id="continue-button" variant="primary">
          {t('provincial-territorial:button.continue')}
        </Button>
      </div>
    </Form>
  );
}
