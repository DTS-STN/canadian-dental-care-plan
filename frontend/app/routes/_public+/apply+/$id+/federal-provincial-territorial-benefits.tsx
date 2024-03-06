import { useState } from 'react';

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
  pageTitleI18nKey: 'provincial-territorial:title',
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const options = await getLookupService().getAllAccessToProvincialTerritorialDentalBenefit();
  const federalSocialPrograms = await getLookupService().getAllFederalSocialPrograms();
  return json({ id, state, options, federalSocialPrograms });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.dentalBenefitsStateSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.dentalBenefitsStateSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { dentalBenefit: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/confirm`, sessionResponseInit);
}

export default function AccessToDentalInsuranceQuestion() {
  const { federalSocialPrograms, options, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const [checked, setChecked] = useState(state.dentalBenefit?.federalBenefit ?? '');

  return (
    <Form method="post">
      <p className="mb-4">{t('provincial-territorial:access-to-dental')}</p>
      <p>{t('provincial-territorial:eligibility-criteria')}</p>
      {options.length > 0 && (
        <div className="my-6">
          {options.length > 0 && (
            <InputRadios
              id="federal-benefit"
              name="federalBenefit"
              legend={t('provincial-territorial:federal-benefits.legend')}
              options={options.map((option) => ({
                children: (
                  <div>
                    <strong>{getNameByLanguage(i18n.language, option)}</strong>,&nbsp;
                    {option.code === 'yes' ? <Trans ns={i18nNamespaces} i18nKey="provincial-territorial:federal-benefits.option-yes" /> : <Trans ns={i18nNamespaces} i18nKey="provincial-territorial:federal-benefits.option-no" />}
                  </div>
                ),
                value: option.code,
                defaultChecked: state.dentalBenefit?.federalBenefit === option.code,
                onChange: (e) => setChecked(e.target.value),
                append: option.code === 'yes' && checked === 'yes' && (
                  <InputRadios
                    id="federal-social-programs"
                    name="federalSocialProgram"
                    legend={t('provincial-territorial:federal-benefits.social-programs.legend')}
                    options={federalSocialPrograms.map((option) => ({
                      children: (
                        <div>
                          <strong>{getNameByLanguage(i18n.language, option)}</strong>
                        </div>
                      ),
                      value: option.code,
                      defaultChecked: state.dentalBenefit?.federalSocialProgram === option.code,
                    }))}
                  />
                ),
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
