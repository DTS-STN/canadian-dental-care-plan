import { Fragment, useEffect, useMemo, useState } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import validator from 'validator';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getEnv } from '~/utils/env.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum FederalBenefitOption {
  No = 'no',
  Yes = 'yes',
}

enum ProvincialTerritorialBenefitOption {
  No = 'no',
  Yes = 'yes',
}

export type DentalBenefitsState = {
  federalBenefit: `${FederalBenefitOption}`;
  federalSocialProgram?: string;
  provincialTerritorialBenefit: `${ProvincialTerritorialBenefitOption}`;
  provincialTerritorialSocialProgram?: string;
  province?: string;
};

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.federalProvincialTerritorialBenefits,
  pageTitleI18nKey: 'apply:dental-benefits.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const { CANADA_COUNTRY_ID } = getEnv();
  const applyFlow = getApplyFlow();
  const lookupService = getLookupService();
  const { id, state } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const federalDentalBenefits = await lookupService.getAllFederalDentalBenefit();
  const provincialTerritorialDentalBenefits = await lookupService.getAllProvincialTerritorialDentalBenefits();
  const federalSocialPrograms = await lookupService.getAllFederalSocialPrograms();
  const provincialTerritorialSocialPrograms = await lookupService.getAllProvincialTerritorialSocialPrograms();
  const allRegions = await lookupService.getAllRegions();
  const regions = allRegions.filter((region) => region.countryId === CANADA_COUNTRY_ID);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:dental-benefits.title') }) };

  return json({ federalDentalBenefits, federalSocialPrograms, id, meta, provincialTerritorialDentalBenefits, provincialTerritorialSocialPrograms, regions, defaultState: state.dentalBenefits, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  // state validation schema
  const dentalBenefitsSchema: z.ZodType<DentalBenefitsState> = z
    .object({
      federalBenefit: z.nativeEnum(FederalBenefitOption, { errorMap: () => ({ message: t('apply:dental-benefits.error-message.federal-benefit-required') }) }),
      federalSocialProgram: z.string().trim().optional(),
      provincialTerritorialBenefit: z.nativeEnum(ProvincialTerritorialBenefitOption, { errorMap: () => ({ message: t('apply:dental-benefits.error-message.provincial-benefit-required') }) }),
      provincialTerritorialSocialProgram: z.string().trim().optional(),
      province: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.federalBenefit === FederalBenefitOption.Yes) {
        if (!val.federalSocialProgram || validator.isEmpty(val.federalSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:dental-benefits.error-message.program-required'), path: ['federalSocialProgram'] });
        }
      }

      if (val.provincialTerritorialBenefit === ProvincialTerritorialBenefitOption.Yes) {
        if (!val.province || validator.isEmpty(val.province)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:dental-benefits.error-message.province-required'), path: ['province'] });
        } else if (!val.provincialTerritorialSocialProgram || validator.isEmpty(val.provincialTerritorialSocialProgram)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('apply:dental-benefits.error-message.program-required'), path: ['provincialTerritorialSocialProgram'] });
        }
      }
    });

  const formData = await request.formData();
  const dentalBenefits = {
    federalBenefit: String(formData.get('federalBenefit') ?? ''),
    federalSocialProgram: formData.get('federalSocialProgram') ? String(formData.get('federalSocialProgram')) : undefined,
    provincialTerritorialBenefit: String(formData.get('provincialTerritorialBenefit') ?? ''),
    provincialTerritorialSocialProgram: formData.get('provincialTerritorialSocialProgram') ? String(formData.get('provincialTerritorialSocialProgram')) : undefined,
    province: formData.get('province') ? String(formData.get('province')) : undefined,
  };
  const parsedDataResult = dentalBenefitsSchema.safeParse(dentalBenefits);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format() });
  }

  const sessionResponseInit = await applyFlow.saveState({ params, request, session, state: { dentalBenefits: parsedDataResult.data, editMode: true } });
  return redirectWithLocale(request, `/apply/${id}/review-information`, sessionResponseInit);
}

export default function AccessToDentalInsuranceQuestion() {
  const { i18n, t } = useTranslation(handle.i18nNamespaces);
  const { federalSocialPrograms, provincialTerritorialSocialPrograms, provincialTerritorialDentalBenefits, federalDentalBenefits, regions, defaultState, id, editMode } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const [federalBenefitValue, setFederalBenefitValue] = useState(defaultState?.federalBenefit);
  const [provincialTerritorialBenefitValue, setProvincialTerritorialBenefitValue] = useState(defaultState?.provincialTerritorialBenefit);
  const [provincialTerritorialSocialProgramValue, setProvincialTerritorialSocialProgramValue] = useState(defaultState?.provincialTerritorialSocialProgram);
  const [provinceValue, setProvinceValue] = useState(defaultState?.province);
  const errorSummaryId = 'error-summary';

  const sortedRegions = useMemo(
    () =>
      regions.sort((a, b) => {
        const nameA = i18n.language === 'en' ? a.nameEn : a.nameFr;
        const nameB = i18n.language === 'en' ? b.nameEn : b.nameFr;
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      }),
    [i18n.language, regions],
  );

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-federal-benefit-option-0': fetcher.data?.errors.federalBenefit?._errors[0],
      'input-radio-federal-social-programs-option-0': fetcher.data?.errors.federalSocialProgram?._errors[0],
      'input-radio-provincial-territorial-benefit-option-0': fetcher.data?.errors.provincialTerritorialBenefit?._errors[0],
      province: fetcher.data?.errors.province?._errors[0],
      'input-radio-provincial-territorial-social-programs-option-0': fetcher.data?.errors.provincialTerritorialSocialProgram?._errors[0],
    }),
    [
      fetcher.data?.errors.federalBenefit?._errors,
      fetcher.data?.errors.federalSocialProgram?._errors,
      fetcher.data?.errors.province?._errors,
      fetcher.data?.errors.provincialTerritorialBenefit?._errors,
      fetcher.data?.errors.provincialTerritorialSocialProgram?._errors,
    ],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  function handleOnFederalBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setFederalBenefitValue(e.target.value as FederalBenefitOption);
  }

  function handleOnProvincialTerritorialBenefitChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setProvincialTerritorialBenefitValue(e.target.value as ProvincialTerritorialBenefitOption);
    if (e.target.value !== ProvincialTerritorialBenefitOption.Yes) {
      setProvincialTerritorialBenefitValue(undefined);
      setProvinceValue(undefined);
      setProvincialTerritorialSocialProgramValue(undefined);
    }
  }

  function handleOnProvincialTerritorialSocialProgramChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setProvincialTerritorialSocialProgramValue(e.target.value);
  }

  function handleOnRegionChanged(e: React.ChangeEvent<HTMLSelectElement>) {
    setProvinceValue(e.target.value);
    setProvincialTerritorialSocialProgramValue(undefined);
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
                  defaultChecked: defaultState?.federalBenefit === option.code,
                  onChange: handleOnFederalBenefitChanged,
                  append: option.code === FederalBenefitOption.Yes && federalBenefitValue === FederalBenefitOption.Yes && (
                    <InputRadios
                      id="federal-social-programs"
                      name="federalSocialProgram"
                      legend={t('dental-benefits.federal-benefits.social-programs.legend')}
                      options={federalSocialPrograms.map((option) => ({
                        children: getNameByLanguage(i18n.language, option),
                        defaultChecked: defaultState?.federalSocialProgram === option.id,
                        value: option.id,
                      }))}
                      errorMessage={errorMessages['input-radio-federal-social-programs-option-0']}
                      required
                    />
                  ),
                }))}
                errorMessage={errorMessages['input-radio-federal-benefit-option-0']}
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
                  defaultChecked: defaultState?.provincialTerritorialBenefit === option.code,
                  onChange: handleOnProvincialTerritorialBenefitChanged,
                  append: option.code === ProvincialTerritorialBenefitOption.Yes && provincialTerritorialBenefitValue === ProvincialTerritorialBenefitOption.Yes && regions.length > 0 && (
                    <Fragment key={option.code}>
                      <div className="space-y-6">
                        <InputSelect
                          id="province"
                          name="province"
                          className="w-full sm:w-1/2"
                          label={t('dental-benefits.provincial-territorial-benefits.social-programs.input-legend')}
                          onChange={handleOnRegionChanged}
                          options={[
                            { children: t('dental-benefits.select-one'), value: '', hidden: true },
                            ...sortedRegions.map((region) => ({
                              key: region.provinceTerritoryStateId,
                              id: region.provinceTerritoryStateId,
                              value: region.provinceTerritoryStateId,
                              children: getNameByLanguage(i18n.language, region),
                            })),
                          ]}
                          defaultValue={provinceValue}
                          errorMessage={errorMessages['province']}
                          required
                        />
                        {provinceValue && (
                          <InputRadios
                            id="provincial-territorial-social-programs"
                            name="provincialTerritorialSocialProgram"
                            legend={t('dental-benefits.provincial-territorial-benefits.social-programs.radio-legend')}
                            errorMessage={errorMessages['input-radio-provincial-territorial-social-programs-option-0']}
                            options={provincialTerritorialSocialPrograms
                              .filter((program) => program.provinceTerritoryStateId === provinceValue)
                              .map((option) => ({
                                children: getNameByLanguage(i18n.language, option),
                                value: option.id,
                                checked: provincialTerritorialSocialProgramValue === option.id,
                                onChange: handleOnProvincialTerritorialSocialProgramChanged,
                              }))}
                            required
                          />
                        )}
                      </div>
                    </Fragment>
                  ),
                }))}
                errorMessage={errorMessages['input-radio-provincial-territorial-benefit-option-0']}
                required
              />
            )}
          </section>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {editMode ? (
              <>
                <ButtonLink id="back-button" to={`/apply/${id}/review-information`} disabled={isSubmitting}>
                  {t('dental-benefits.button.cancel-btn')}
                </ButtonLink>
                <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                  {t('dental-benefits.button.save-btn')}
                </Button>
              </>
            ) : (
              <>
                <ButtonLink id="back-button" to={`/apply/${id}/dental-insurance`} disabled={isSubmitting}>
                  <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                  {t('dental-benefits.button.back')}
                </ButtonLink>
                <Button variant="primary" id="continue-button" disabled={isSubmitting}>
                  {t('dental-benefits.button.continue')}
                  <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
                </Button>
              </>
            )}
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
