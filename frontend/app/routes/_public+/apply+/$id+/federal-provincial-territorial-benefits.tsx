import { Fragment, useState } from 'react';

import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'apply:dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return getTitleMetaTags(t('gcweb:meta.title.template', { title: t('apply:dental-benefits.title') }));
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { COUNTRY_CODE_CANADA } = getEnv();
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const federalDentalBenefits = await getLookupService().getAllFederalDentalBenefit();
  const provincialTerritorialDentalBenefits = await getLookupService().getAllProvincialTerritorialDentalBenefits();
  const federalSocialPrograms = await getLookupService().getAllFederalSocialPrograms();
  const provincialTerritorialSocialPrograms = await getLookupService().getAllProvincialTerritorialSocialPrograms();
  const allRegions = await getLookupService().getAllRegions();
  const regions = allRegions.filter((region) => region.countryId === COUNTRY_CODE_CANADA);
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
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, provincialTerritorialDentalBenefits, federalDentalBenefits, regions, state, id } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const [federalBenefitChecked, setFederalBenefitChecked] = useState(state.dentalBenefit?.federalBenefit ?? '');
  const [provincialTerritorialBenefitChecked, setProvincialTerritorialBenefitChecked] = useState(state.dentalBenefit?.provincialTerritorialBenefit ?? '');

  const sortedRegions = regions.sort((a, b) => {
    const nameA = i18n.language === 'en' ? a.nameEn : a.nameFr;
    const nameB = i18n.language === 'en' ? b.nameEn : b.nameFr;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });

  const [selectedRegion, setSelectedRegion] = useState(state.dentalBenefit?.provincialTerritorialSocialProgram ?? sortedRegions[0].provinceTerritoryStateId);

  return (
    <Form method="post">
      <section>
        <p className="mb-4">{t('dental-benefits.access-to-dental')}</p>
        <p className="mb-6">{t('dental-benefits.eligibility-criteria')}</p>
        {federalDentalBenefits.length > 0 && (
          <>
            <h2 className="mb-4 mt-6 text-xl font-bold">{t('dental-benefits.federal-benefits.title')}</h2>
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
          </>
        )}
      </section>
      <section className="mt-8">
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
                      options={sortedRegions.map((region) => ({
                        key: region.provinceTerritoryStateId,
                        id: region.provinceTerritoryStateId,
                        value: region.provinceTerritoryStateId,
                        children: i18n.language === 'en' ? region.nameEn : region.nameFr,
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
        <ButtonLink to={`/apply/${id}/dental-insurance`}>
          <FontAwesomeIcon icon={faChevronLeft} className="ms-3 block size-4" />
          {t('dental-benefits.button.back')}
        </ButtonLink>
        <Button variant="primary" id="continue-button">
          {t('dental-benefits.button.continue')}
          <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
        </Button>
      </div>
    </Form>
  );
}
