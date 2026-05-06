import { data, redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { Trans, useTranslation } from 'react-i18next';
import * as z from 'zod';

import type { Route } from './+types/submit';

import { TYPES } from '~/.server/constants';
import { savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { loadPublicApplicationSimplifiedAdultStateForReview } from '~/.server/routes/helpers/public-application-simplified-adult-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DebugPayload } from '~/components/debug-payload';
import { ErrorSummary } from '~/components/error-summary';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { LoadingButton } from '~/components/loading-button';
import { NavigationButtonLink } from '~/components/navigation-buttons';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/simplified-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const CHECKBOX_VALUE = {
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'applicationSimplifiedAdult', 'gcweb'),
  pageIdentifier: pageIds.public.application.simplifiedAdult.submit,
  pageTitleI18nKey: 'applicationSimplifiedAdult:submit.pageHeading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationSimplifiedAdultStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = {
    title: t(($) => $.meta.title.template, { ns: 'gcweb', title: t(($) => $.submit.pageTitle, { ns: 'applicationSimplifiedAdult' }) }),
  };

  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationDtoMapper = appContainer.get(TYPES.BenefitRenewalDtoMapper);
  const benefitApplicationStateMapper = appContainer.get(TYPES.BenefitRenewalStateMapper);
  const benefitApplicationDto = viewPayloadEnabled && benefitApplicationStateMapper.mapBenefitRenewalAdultStateToBenefitRenewalDto(state);
  const payload = benefitApplicationDto && benefitApplicationDtoMapper.mapBenefitRenewalDtoToBenefitRenewalRequestEntity(benefitApplicationDto, 'public');

  return {
    state: {
      applicantName: `${state.applicantInformation.firstName} ${state.applicantInformation.lastName}`,
    },
    meta,
    payload,
  };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  const state = loadPublicApplicationSimplifiedAdultStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-adult']);

  const formData = await request.formData();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const submitTermsSchema = z.object({
    acknowledgeInfo: z.literal(true, {
      error: t(($) => $.submit.errorMessage.acknowledgeInfoRequired, { ns: 'applicationSimplifiedAdult' }),
    }),
    acknowledgeCriteria: z.literal(true, {
      error: t(($) => $.submit.errorMessage.acknowledgeCriteriaRequired, { ns: 'applicationSimplifiedAdult' }),
    }),
  });

  const parsedDataResult = submitTermsSchema.safeParse({
    acknowledgeInfo: formData.get('acknowledgeInfo')?.toString() === CHECKBOX_VALUE.yes,
    acknowledgeCriteria: formData.get('acknowledgeCriteria')?.toString() === CHECKBOX_VALUE.yes,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const benefitApplicationDto = appContainer.get(TYPES.BenefitRenewalStateMapper).mapBenefitRenewalAdultStateToBenefitRenewalDto(state);
  const confirmationCode = await appContainer.get(TYPES.BenefitRenewalService).createBenefitRenewal(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };
  savePublicApplicationState({ params, session, state: { submitTerms: parsedDataResult.data, submissionInfo } });

  return redirect(getPathById('public/application/$id/simplified-adult/confirmation', params));
}

export default function RenewAdultSubmit({ loaderData, params }: Route.ComponentProps) {
  const { state, payload } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = fetcher.data?.errors;

  const eligibilityLink = <InlineLink to={t(($) => $.submit.doYouQualifyHref, { ns: 'applicationSimplifiedAdult' })} className="external-link" newTabIndicator target="_blank" />;

  return (
    <ErrorSummaryProvider actionData={fetcher.data}>
      <ProgressStepper activeStep="submit" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <ErrorSummary />
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t(($) => $.submit.overview, { ns: 'applicationSimplifiedAdult' })}</h2>
            <div className="space-y-4">
              <p>{t(($) => $.submit.youAreSubmitting, { ns: 'applicationSimplifiedAdult' })}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{state.applicantName}</li>
              </ul>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t(($) => $.submit.reviewYourApplication, { ns: 'applicationSimplifiedAdult' })}</h2>
            <p>{t(($) => $.submit.pleaseReview, { ns: 'applicationSimplifiedAdult' })}</p>
            <ButtonLink variant="primary" routeId="public/application/$id/your-application" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Adult:Action click">
              {t(($) => $.submit.reviewApplication, { ns: 'applicationSimplifiedAdult' })}
            </ButtonLink>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t(($) => $.submit.submitYourApplication, { ns: 'applicationSimplifiedAdult' })}</h2>
            <p>{t(($) => $.submit.bySubmitting, { ns: 'applicationSimplifiedAdult' })}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey={($) => $.applicationSimplifiedAdult.submit.reviewEligibilityCriteria} components={{ eligibilityLink }} />
            </p>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <div className="space-y-2">
                <InputCheckbox id="acknowledge-info" name="acknowledgeInfo" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeInfo} required>
                  {t(($) => $.submit.infoIsCorrect, { ns: 'applicationSimplifiedAdult' })}
                </InputCheckbox>
                <InputCheckbox id="acknowledge-criteria" name="acknowledgeCriteria" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeCriteria} required>
                  {t(($) => $.submit.iUnderstand, { ns: 'applicationSimplifiedAdult' })}
                </InputCheckbox>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_170px]">
                <LoadingButton loading={isSubmitting} variant="green" className="order-first h-full text-base sm:order-last sm:text-lg" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Adult:Submit click">
                  {t(($) => $.submit.submit, { ns: 'applicationSimplifiedAdult' })}
                </LoadingButton>
                <NavigationButtonLink
                  disabled={isSubmitting}
                  variant="secondary"
                  direction="previous"
                  routeId="public/application/$id/simplified-adult/dental-insurance"
                  params={params}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Simplified_Adult:Back click"
                >
                  {t(($) => $.submit.dentalInsurance, { ns: 'applicationSimplifiedAdult' })}
                </NavigationButtonLink>
              </div>
            </fetcher.Form>
          </section>
        </div>
        <div className="mt-8">
          <InlineLink routeId="public/application/$id/simplified-adult/exit-application" params={params}>
            {t(($) => $.submit.exitApplication, { ns: 'applicationSimplifiedAdult' })}
          </InlineLink>
        </div>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy />
        </div>
      )}
    </ErrorSummaryProvider>
  );
}
