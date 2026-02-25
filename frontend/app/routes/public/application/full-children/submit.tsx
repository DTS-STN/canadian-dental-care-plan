import { data, redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/submit';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullChildStateForReview } from '~/.server/routes/helpers/public-application-full-child-route-helpers';
import { savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DebugPayload } from '~/components/debug-payload';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { NavigationButton, NavigationButtonLink } from '~/components/navigation-buttons';
import { useFetcherSubmissionState } from '~/hooks';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/full-children/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const CHECKBOX_VALUE = {
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-full-child', 'gcweb'),
  pageIdentifier: pageIds.public.application.fullChild.submit,
  pageTitleI18nKey: 'application-full-child:submit.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullChildStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['full-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-child:submit.page-title') }) };

  const children = [];
  for (const child of state.children) {
    children.push(`${child.information.firstName} ${child.information.lastName}`);
  }

  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  let payload;
  if (state.context === 'intake') {
    const benefitApplicationDtoMapper = appContainer.get(TYPES.BenefitApplicationDtoMapper);
    const benefitApplicationStateMapper = appContainer.get(TYPES.BenefitApplicationStateMapper);
    payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationStateMapper.mapApplicationChildrenStateToBenefitApplicationDto(state));
  } else {
    const benefitRenewalDtoMapper = appContainer.get(TYPES.BenefitRenewalDtoMapper);
    const benefitRenewalStateMapper = appContainer.get(TYPES.BenefitRenewalStateMapper);
    payload = viewPayloadEnabled && benefitRenewalDtoMapper.mapChildBenefitRenewalDtoToBenefitRenewalRequestEntity(benefitRenewalStateMapper.mapBenefitRenewalChildStateToChildBenefitRenewalDto(state));
  }

  return {
    state: {
      children,
    },
    meta,
    payload,
  };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  const state = loadPublicApplicationFullChildStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['full-children']);

  const formData = await request.formData();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const submitTermsSchema = z.object({
    acknowledgeInfo: z.literal(true, { error: t('application-full-child:submit.error-message.acknowledge-info-required') }),
    acknowledgeCriteria: z.literal(true, { error: t('application-full-child:submit.error-message.acknowledge-criteria-required') }),
  });

  const parsedDataResult = submitTermsSchema.safeParse({
    acknowledgeInfo: formData.get('acknowledgeInfo')?.toString() === CHECKBOX_VALUE.yes,
    acknowledgeCriteria: formData.get('acknowledgeCriteria')?.toString() === CHECKBOX_VALUE.yes,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  if (state.context === 'intake') {
    const benefitApplicationDto = appContainer.get(TYPES.BenefitApplicationStateMapper).mapApplicationChildrenStateToBenefitApplicationDto(state);
    const confirmationCode = await appContainer.get(TYPES.BenefitApplicationService).createBenefitApplication(benefitApplicationDto);
    const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };
    savePublicApplicationState({ params, session, state: { submitTerms: parsedDataResult.data, submissionInfo } });
  } else {
    const benefitRenewalDto = appContainer.get(TYPES.BenefitRenewalStateMapper).mapBenefitRenewalChildStateToChildBenefitRenewalDto(state);
    const confirmationCode = await appContainer.get(TYPES.BenefitRenewalService).createChildBenefitRenewal(benefitRenewalDto);
    const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };
    savePublicApplicationState({ params, session, state: { submitTerms: parsedDataResult.data, submissionInfo } });
  }

  return redirect(getPathById('public/application/$id/full-children/confirmation', params));
}

export default function NewChildrenSubmit({ loaderData, params }: Route.ComponentProps) {
  const { state, payload } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = fetcher.data?.errors;

  const eligibilityLink = <InlineLink to={t('application-full-child:submit.do-you-qualify.href')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <ErrorSummaryProvider actionData={fetcher.data}>
      <ProgressStepper activeStep="submit" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <ErrorSummary />
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-full-child:submit.overview')}</h2>
            <div>
              <p>{t('application-full-child:submit.you-are-submitting')}</p>
              <ul className="list-disc space-y-1 pl-7">
                {state.children.map((child, index) => (
                  <li key={index}>{child}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-full-child:submit.review-your-application')}</h2>
            <p>{t('application-full-child:submit.please-review')}</p>
            <ButtonLink variant="primary" routeId="public/application/$id/full-children/parent-or-guardian" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Action click">
              {t('application-full-child:submit.review-application')}
            </ButtonLink>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-full-child:submit.submit-your-application')}</h2>
            <p>{t('application-full-child:submit.by-submitting')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="application-full-child:submit.review-eligibility-criteria" components={{ eligibilityLink }} />
            </p>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <div className="space-y-2">
                <InputCheckbox id="acknowledge-info" name="acknowledgeInfo" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeInfo} required>
                  {t('application-full-child:submit.info-is-correct')}
                </InputCheckbox>
                <InputCheckbox id="acknowledge-criteria" name="acknowledgeCriteria" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeCriteria} required>
                  {t('application-full-child:submit.i-understand')}
                </InputCheckbox>
              </div>
              <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
                <NavigationButton loading={isSubmitting} variant="primary" direction="next" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Submit click">
                  {t('application-full-child:submit.submit')}
                </NavigationButton>
                <NavigationButtonLink
                  disabled={isSubmitting}
                  variant="secondary"
                  direction="previous"
                  routeId="public/application/$id/full-children/childrens-application"
                  params={params}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Full_Child:Back click"
                >
                  {t('application-full-child:submit.childrens-application')}
                </NavigationButtonLink>
              </div>
            </fetcher.Form>
          </section>
        </div>
        <div className="mt-8">
          <InlineLink routeId="public/application/$id/full-children/exit-application" params={params}>
            {t('application-full-child:submit.exit-application')}
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
