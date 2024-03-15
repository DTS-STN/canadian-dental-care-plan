import { Fragment, useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputOptionProps } from '~/components/input-option';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { featureEnabled, getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'apply:dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { CANADA_COUNTRY_ID } = getEnv();
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const federalDentalBenefits = await getLookupService().getAllFederalDentalBenefit();
  const provincialTerritorialDentalBenefits = await getLookupService().getAllProvincialTerritorialDentalBenefits();
  const federalSocialPrograms = await getLookupService().getAllFederalSocialPrograms();
  const provincialTerritorialSocialPrograms = await getLookupService().getAllProvincialTerritorialSocialPrograms();
  const allRegions = await getLookupService().getAllRegions();
  const regions = allRegions.filter((region) => region.countryId === CANADA_COUNTRY_ID);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:dental-benefits.title') }) };

  return json({ federalDentalBenefits, federalSocialPrograms, id, meta, provincialTerritorialDentalBenefits, provincialTerritorialSocialPrograms, regions, state: state.dentalBenefit });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const dentalBenefitSchema = applyFlow.dentalBenefitsStateSchema.superRefine((val, ctx) => {
    if (val.federalBenefit === 'yes' && (!val.federalSocialProgram || val.federalSocialProgram.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'federal-program',
        path: ['federalSocialProgram'],
      });
    }
    if (val.provincialTerritorialBenefit === 'yes' && (!val.provincialTerritorialSocialProgram || val.provincialTerritorialSocialProgram.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'provincial-program',
        path: ['provincialTerritorialSocialProgram'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'empty-province',
        path: ['province'],
      });
    }
  });
  const parsedDataResult = dentalBenefitSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof dentalBenefitSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { dentalBenefit: parsedDataResult.data },
  });

  return featureEnabled('demographic-questions') ? redirectWithLocale(request, `/apply/${id}/demographics`, sessionResponseInit) : redirectWithLocale(request, `/apply/${id}/confirm`, sessionResponseInit);
}

export default function AccessToDentalInsuranceQuestion() {
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, provincialTerritorialDentalBenefits, federalDentalBenefits, regions, state, id } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const [federalBenefitChecked, setFederalBenefitChecked] = useState(state?.federalBenefit);
  const [provincialTerritorialBenefitChecked, setProvincialTerritorialBenefitChecked] = useState(state?.provincialTerritorialBenefit);
  const [provincialProgramOption, setProvincialProgramOption] = useState(state?.provincialTerritorialSocialProgram);
  const errorSummaryId = 'error-summary';
  const navigation = useNavigation();

  const sortedRegions = regions.sort((a, b) => {
    const nameA = i18n.language === 'en' ? a.nameEn : a.nameFr;
    const nameB = i18n.language === 'en' ? b.nameEn : b.nameFr;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });

  const [selectedRegion, setSelectedRegion] = useState(state?.province);

  useEffect(() => {
    if (provincialTerritorialBenefitChecked !== 'yes') {
      setSelectedRegion('');
    }
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData, provincialTerritorialBenefitChecked]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`dental-benefits.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    federalBenefit: getErrorMessage(actionData?.errors.federalBenefit?._errors[0]),
    federalSocialProgram: getErrorMessage(actionData?.errors.federalSocialProgram?._errors[0]),
    provincialTerritorialBenefit: getErrorMessage(actionData?.errors.provincialTerritorialBenefit?._errors[0]),
    provincialTerritorialSocialProgram: getErrorMessage(actionData?.errors.provincialTerritorialSocialProgram?._errors[0]),
    province: getErrorMessage(actionData?.errors.province?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  const dummyOption: InputOptionProps = { children: t('dental-benefits.select-one'), value: '' };

  function handleSelectRegion(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedRegion(event.target.value);
    setProvincialProgramOption('');
  }

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
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
                  defaultChecked: state?.federalBenefit === option.code,
                  onChange: (e) => setFederalBenefitChecked(e.target.value),
                  append: option.code === 'yes' && federalBenefitChecked === 'yes' && (
                    <InputRadios
                      id="federal-social-programs"
                      name="federalSocialProgram"
                      legend={<span className="font-normal">{t('dental-benefits.federal-benefits.social-programs.legend')}</span>}
                      options={federalSocialPrograms.map((option) => ({
                        children: <span className="font-bold">{getNameByLanguage(i18n.language, option)}</span>,
                        value: getNameByLanguage(i18n.language, option),
                        defaultChecked: state?.federalSocialProgram === getNameByLanguage(i18n.language, option),
                      }))}
                      errorMessage={errorMessages.federalSocialProgram}
                      required={errorSummaryItems.length > 0}
                    />
                  ),
                }))}
                errorMessage={errorMessages.federalBenefit}
                required={errorSummaryItems.length > 0}
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
                  defaultChecked: state?.provincialTerritorialBenefit === option.code,
                  onChange: (e) => setProvincialTerritorialBenefitChecked(e.target.value),
                  append: option.code === 'yes' && provincialTerritorialBenefitChecked === 'yes' && regions.length > 0 && (
                    <Fragment key={option.code}>
                      <InputSelect
                        id="province"
                        name="province"
                        className="mb-4 w-full sm:w-1/2"
                        label={t('dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                        onChange={handleSelectRegion}
                        options={[
                          dummyOption,
                          ...sortedRegions.map((region) => ({
                            key: region.provinceTerritoryStateId,
                            id: region.provinceTerritoryStateId,
                            value: region.provinceTerritoryStateId,
                            children: i18n.language === 'en' ? region.nameEn : region.nameFr,
                          })),
                        ]}
                        defaultValue={state?.province}
                        errorMessage={errorMessages.province}
                        required={errorSummaryItems.length > 0}
                      />
                      <InputRadios
                        id="provincial-territorial-social-programs"
                        name="provincialTerritorialSocialProgram"
                        legend={<span className="font-normal">{t('dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}</span>}
                        errorMessage={errorMessages.provincialTerritorialSocialProgram}
                        required={errorSummaryItems.length > 0}
                        options={provincialTerritorialSocialPrograms
                          .filter((program) => program.provinceTerritoryStateId === selectedRegion)
                          .map((option) => ({
                            children: <span className="font-bold">{getNameByLanguage(i18n.language, option)}</span>,
                            value: getNameByLanguage(i18n.language, option),
                            defaultChecked: provincialProgramOption === getNameByLanguage(i18n.language, option),
                            onChange: (e) => setProvincialProgramOption(e.target.value),
                          }))}
                      />
                    </Fragment>
                  ),
                }))}
                errorMessage={errorMessages.provincialTerritorialBenefit}
                required={errorSummaryItems.length > 0}
              />
            </div>
          )}
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink to={`/apply/${id}/dental-insurance`} className={cn(navigation.state !== 'idle' && 'pointer-events-none')}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('dental-benefits.button.back')}
          </ButtonLink>
          <Button variant="primary" id="continue-button" disabled={navigation.state !== 'idle'}>
            {t('dental-benefits.button.continue')}
            <FontAwesomeIcon icon={navigation.state !== 'idle' ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', navigation.state !== 'idle' && 'animate-spin')} />
          </Button>
        </div>
      </Form>
    </>
  );
}
