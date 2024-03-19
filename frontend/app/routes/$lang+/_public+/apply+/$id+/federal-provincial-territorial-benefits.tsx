import { Fragment, useEffect, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputOptionProps } from '~/components/input-option';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { Progress } from '~/components/progress';
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
  pageIdentifier: pageIds.public.apply.federalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'apply:dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
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
        message: 'empty-program',
        path: ['federalSocialProgram'],
      });
    }
    if (val.provincialTerritorialBenefit === 'yes') {
      if (!val.province) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'empty-province',
          path: ['province'],
        });
      }
      if (val.province && !val.provincialTerritorialSocialProgram) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'empty-program',
          path: ['provincialTerritorialSocialProgram'],
        });
      }
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
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, provincialTerritorialDentalBenefits, federalDentalBenefits, regions, state, id } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [checkedFederalOption, setCheckedFederalOption] = useState(state?.federalBenefit);
  const [checkedProvincialOption, setCheckedProvincialOption] = useState(state?.provincialTerritorialBenefit);
  const [provincialProgramOption, setProvincialProgramOption] = useState(state?.provincialTerritorialSocialProgram);
  const errorSummaryId = 'error-summary';

  const sortedRegions = regions.sort((a, b) => {
    const nameA = i18n.language === 'en' ? a.nameEn : a.nameFr;
    const nameB = i18n.language === 'en' ? b.nameEn : b.nameFr;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });

  const [selectedRegion, setSelectedRegion] = useState(state?.province);

  const defaultState = {
    checkedProvincialOption: '',
    selectedRegion: '',
    provincialProgramOption: '',
  };

  function resetProvincialOptionState() {
    setCheckedProvincialOption(defaultState.checkedProvincialOption);
    setSelectedRegion(defaultState.selectedRegion);
    setProvincialProgramOption(defaultState.provincialProgramOption);
  }

  useEffect(() => {
    if (fetcher.data?.formData && hasErrors(fetcher.data.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`dental-benefits.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    federalBenefit: getErrorMessage(fetcher.data?.errors.federalBenefit?._errors[0]),
    federalSocialProgram: getErrorMessage(fetcher.data?.errors.federalSocialProgram?._errors[0]),
    provincialTerritorialBenefit: getErrorMessage(fetcher.data?.errors.provincialTerritorialBenefit?._errors[0]),
    provincialTerritorialSocialProgram: getErrorMessage(fetcher.data?.errors.provincialTerritorialSocialProgram?._errors[0]),
    province: getErrorMessage(fetcher.data?.errors.province?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  const dummyOption: InputOptionProps = { children: t('dental-benefits.select-one'), value: '' };

  function handleSelectRegion(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedRegion(event.target.value);
    setProvincialProgramOption('');
  }

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={90} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <section>
            <p className="mb-4">{t('dental-benefits.access-to-dental')}</p>
            <p className="mb-4">{t('dental-benefits.eligibility-criteria')}</p>
            <h2 className="my-6 font-lato text-2xl font-bold">{t('dental-benefits.federal-benefits.title')}</h2>
            {federalDentalBenefits.length > 0 && (
              <InputRadios
                id="federal-benefit"
                name="federalBenefit"
                legend={t('dental-benefits.federal-benefits.legend')}
                options={federalDentalBenefits.map((option) => ({
                  children: <Trans ns={handle.i18nNamespaces}>{`dental-benefits.federal-benefits.option-${option.code}`}</Trans>,
                  value: option.code,
                  defaultChecked: state?.federalBenefit === option.code,
                  onChange: (e) => setCheckedFederalOption(e.target.value),
                  append: option.code === 'yes' && checkedFederalOption === 'yes' && (
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
                      required
                    />
                  ),
                }))}
                errorMessage={errorMessages.federalBenefit}
                required
              />
            )}
          </section>
          <section>
            <h2 className="my-6 font-lato text-2xl font-bold">{t('dental-benefits.provincial-territorial-benefits.title')}</h2>
            {provincialTerritorialDentalBenefits.length > 0 && (
              <InputRadios
                id="provincial-territorial-benefit"
                name="provincialTerritorialBenefit"
                legend={t('dental-benefits.provincial-territorial-benefits.legend')}
                options={provincialTerritorialDentalBenefits.map((option) => ({
                  children: <Trans ns={handle.i18nNamespaces}>{`dental-benefits.provincial-territorial-benefits.option-${option.code}`}</Trans>,
                  value: option.code,
                  defaultChecked: state?.provincialTerritorialBenefit === option.code,
                  onChange: (e) => {
                    setCheckedProvincialOption(e.target.value);
                    if (e.target.value !== 'yes') {
                      resetProvincialOptionState();
                    }
                  },
                  append: option.code === 'yes' && checkedProvincialOption === 'yes' && regions.length > 0 && (
                    <Fragment key={option.code}>
                      <div className="space-y-6">
                        <InputSelect
                          id="province"
                          name="province"
                          className="w-full sm:w-1/2"
                          label={t('dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                          onChange={handleSelectRegion}
                          options={[
                            dummyOption,
                            ...sortedRegions.map((region) => ({
                              key: region.provinceTerritoryStateId,
                              id: region.provinceTerritoryStateId,
                              value: region.provinceTerritoryStateId,
                              children: getNameByLanguage(i18n.language, region),
                            })),
                          ]}
                          defaultValue={selectedRegion}
                          errorMessage={errorMessages.province}
                          required
                        />
                        <InputRadios
                          id="provincial-territorial-social-programs"
                          name="provincialTerritorialSocialProgram"
                          legend={selectedRegion && <span className="font-normal">{t('dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}</span>}
                          errorMessage={selectedRegion && errorMessages.provincialTerritorialSocialProgram}
                          options={provincialTerritorialSocialPrograms
                            .filter((program) => program.provinceTerritoryStateId === selectedRegion)
                            .map((option) => ({
                              children: <span className="font-bold">{getNameByLanguage(i18n.language, option)}</span>,
                              value: option.id,
                              checked: provincialProgramOption === option.id,
                              onChange: (e) => setProvincialProgramOption(e.target.value),
                            }))}
                        />
                      </div>
                    </Fragment>
                  ),
                }))}
                errorMessage={errorMessages.provincialTerritorialBenefit}
                required
              />
            )}
          </section>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to={`/apply/${id}/dental-insurance`} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('dental-benefits.button.back')}
            </ButtonLink>
            <Button variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('dental-benefits.button.continue')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
