import { Fragment, useState } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('dental-benefits.title') }) }];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const federalDentalBenefits = await getLookupService().getAllFederalDentalBenefit();
  const provincialTerritorialDentalBenefits = await getLookupService().getAllProvincialTerritorialDentalBenefits();
  const federalSocialPrograms = await getLookupService().getAllFederalSocialPrograms();
  const provincialTerritorialSocialPrograms = await getLookupService().getAllProvincialTerritorialSocialPrograms();
  const regions = await getLookupService().getAllRegions();

  const language = request.headers.get('Accept-Language')?.includes('fr') ? 'fr' : 'en';

  regions.sort((a, b) => {
    const nameA = language === 'en' ? a.nameEnglish : a.nameFrench;
    const nameB = language === 'fr' ? b.nameEnglish : b.nameFrench;
    return nameA.localeCompare(nameB);
  });

  return json({ id, state, federalDentalBenefits, provincialTerritorialDentalBenefits, federalSocialPrograms, provincialTerritorialSocialPrograms, regions });
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
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, provincialTerritorialDentalBenefits, federalDentalBenefits, regions, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const [federalBenefitChecked, setFederalBenefitChecked] = useState(state.dentalBenefit?.federalBenefit ?? '');
  const [provincialTerritorialBenefitChecked, setProvincialTerritorialBenefitChecked] = useState(state.dentalBenefit?.provincialTerritorialBenefit ?? '');
  const [selectedRegion, setSelectedRegion] = useState(state.dentalBenefit?.provincialTerritorialSocialProgram ?? 'AB');
  return (
    <Form method="post">
      <section>
        <p className="mb-4">{t('dental-benefits.access-to-dental')}</p>
        <p className="mb-6">{t('dental-benefits.eligibility-criteria')}</p>
        {federalDentalBenefits.length > 0 && (
          <div className="my-6">
            <h2 className="mb-4 text-xl font-bold">{t('dental-benefits.federal-benefits.title')}</h2>
            <InputRadios
              id="federal-benefit"
              name="federalBenefit"
              legend={t('dental-benefits.federal-benefits.legend')}
              options={federalDentalBenefits.map((option) => ({
                children: <Trans ns={handle.i18nNamespaces}>{`dental-benefits.federal-benefits.option-${option.code}`}</Trans>,
                value: option.code,
                defaultChecked: state.dentalBenefit?.federalBenefit === option.code,
                onChange: (e) => setFederalBenefitChecked(e.target.value),
                append: option.code === 'yes' && federalBenefitChecked === 'yes' && (
                  <InputRadios
                    id="federal-social-programs"
                    name="federalSocialProgram"
                    legend={<span className="font-normal">{t('dental-benefits.federal-benefits.social-programs.legend')}</span>}
                    options={federalSocialPrograms.map((option) => ({
                      children: <span className="font-bold">{getNameByLanguage(i18n.language, option)}</span>,
                      value: option.code,
                      defaultChecked: state.dentalBenefit?.federalSocialProgram === option.code,
                    }))}
                  />
                ),
              }))}
            />
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">{t('dental-benefits.provincial-territorial-benefits.title')}</h2>
        {provincialTerritorialDentalBenefits.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="provincial-territorial-benefit"
              name="provincialTerritorialBenefit"
              legend={t('dental-benefits.provincial-territorial-benefits.legend')}
              options={provincialTerritorialDentalBenefits.map((option) => ({
                children: <Trans ns={handle.i18nNamespaces}>{`dental-benefits.provincial-territorial-benefits.option-${option.code}`}</Trans>,
                value: option.code,
                defaultChecked: state.dentalBenefit?.provincialTerritorialBenefit === option.code,
                onChange: (e) => setProvincialTerritorialBenefitChecked(e.target.value),
                append: option.code === 'yes' && provincialTerritorialBenefitChecked === 'yes' && regions.length > 0 && (
                  <Fragment key={option.code}>
                    <InputSelect
                      id="province"
                      name="province"
                      className="mb-4 w-full sm:w-1/2"
                      label={t('dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                      defaultValue={state.dentalBenefit?.provincialTerritorialBenefit}
                      required
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      options={regions
                        .filter((region) => region.countryId === 'CAN')
                        .map((region) => ({
                          key: region.provinceTerritoryStateId,
                          id: region.provinceTerritoryStateId,
                          value: region.provinceTerritoryStateId,
                          children: i18n.language === 'en' ? region.nameEnglish : region.nameFrench,
                        }))}
                    />
                    <InputRadios
                      id="provincial-territorial-social-programs"
                      name="provincialTerritorialSocialProgram"
                      legend={<span className="font-normal">{t('dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}</span>}
                      options={provincialTerritorialSocialPrograms
                        .filter((program) => program.provinceTerritoryStateId === selectedRegion)
                        .map((option) => ({
                          children: <span className="font-bold">{getNameByLanguage(i18n.language, option)}</span>,
                          value: option.code,
                          defaultChecked: state.dentalBenefit?.provincialTerritorialSocialProgram === option.code,
                        }))}
                    />
                  </Fragment>
                ),
              }))}
            />
          </div>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to="/apply">
          {t('dental-benefits.button.back')}
        </ButtonLink>
        <Button id="continue-button" variant="primary">
          {t('dental-benefits.button.continue')}
        </Button>
      </div>
    </Form>
  );
}
