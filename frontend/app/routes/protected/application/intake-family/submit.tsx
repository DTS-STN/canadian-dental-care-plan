import { data, redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/submit';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplicationIntakeFamilyStateForReview } from '~/.server/routes/helpers/protected-application-intake-family-route-helpers';
import { saveProtectedApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/protected-application-route-helpers';
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
import { ProgressStepper } from '~/routes/protected/application/intake-family/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const CHECKBOX_VALUE = {
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-application', 'protected-application-intake-family', 'gcweb'),
  pageIdentifier: pageIds.protected.application.intakeFamily.submit,
  pageTitleI18nKey: 'protected-application-intake-family:submit.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeFamilyStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['intake-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-application-intake-family:submit.page-title') }) };

  const children = [];
  for (const child of state.children) {
    children.push(`${child.information.firstName} ${child.information.lastName}`);
  }

  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationDtoMapper = appContainer.get(TYPES.BenefitApplicationDtoMapper);
  const benefitApplicationStateMapper = appContainer.get(TYPES.BenefitApplicationStateMapper);
  const payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapBenefitApplicationDtoToProtectedBenefitApplicationRequestEntity(benefitApplicationStateMapper.mapApplicationFamilyStateToBenefitApplicationDto(state));

  return {
    state: {
      applicantName: `${state.applicantInformation.firstName} ${state.applicantInformation.lastName}`,
      children,
    },
    meta,
    payload,
  };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplicationIntakeFamilyStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['intake-family']);

  const formData = await request.formData();
  const t = await getFixedT(request, handle.i18nNamespaces);

  securityHandler.validateCsrfToken({ formData, session });

  const submitTermsSchema = z.object({
    acknowledgeInfo: z.literal(true, { error: t('protected-application-intake-family:submit.error-message.acknowledge-info-required') }),
    acknowledgeCriteria: z.literal(true, { error: t('protected-application-intake-family:submit.error-message.acknowledge-criteria-required') }),
  });

  const parsedDataResult = submitTermsSchema.safeParse({
    acknowledgeInfo: formData.get('acknowledgeInfo')?.toString() === CHECKBOX_VALUE.yes,
    acknowledgeCriteria: formData.get('acknowledgeCriteria')?.toString() === CHECKBOX_VALUE.yes,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const benefitApplicationDto = appContainer.get(TYPES.BenefitApplicationStateMapper).mapApplicationFamilyStateToBenefitApplicationDto(state);
  const confirmationCode = await appContainer.get(TYPES.BenefitApplicationService).createProtectedBenefitApplication(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };
  saveProtectedApplicationState({ params, session, state: { submitTerms: parsedDataResult.data, submissionInfo } });

  return redirect(getPathById('protected/application/$id/intake-family/confirmation', params));
}

export default function ProtectedNewFamilySubmit({ loaderData, params }: Route.ComponentProps) {
  const { state, payload } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = fetcher.data?.errors;

  const eligibilityLink = <InlineLink to={t('protected-application-intake-family:submit.do-you-qualify.href')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <ErrorSummaryProvider actionData={fetcher.data}>
      <ProgressStepper activeStep="submit" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <ErrorSummary />
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('protected-application-intake-family:submit.overview')}</h2>
            <div>
              <p>{t('protected-application-intake-family:submit.you-are-submitting')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{state.applicantName}</li>
                {state.children.map((child, index) => (
                  <li key={index}>{child}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('protected-application-intake-family:submit.review-your-application')}</h2>
            <p>{t('protected-application-intake-family:submit.please-review')}</p>
            <ButtonLink variant="primary" routeId="protected/application/$id/intake-family/marital-status" params={params} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Family:Action click">
              {t('protected-application-intake-family:submit.review-application')}
            </ButtonLink>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('protected-application-intake-family:submit.submit-your-application')}</h2>
            <p>{t('protected-application-intake-family:submit.by-submitting')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="protected-application-intake-family:submit.review-eligibility-criteria" components={{ eligibilityLink }} />
            </p>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <div className="space-y-2">
                <InputCheckbox id="acknowledge-info" name="acknowledgeInfo" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeInfo} required>
                  {t('protected-application-intake-family:submit.info-is-correct')}
                </InputCheckbox>
                <InputCheckbox id="acknowledge-criteria" name="acknowledgeCriteria" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeCriteria} required>
                  {t('protected-application-intake-family:submit.i-understand')}
                </InputCheckbox>
              </div>
              <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
                <NavigationButton loading={isSubmitting} variant="primary" direction="next" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Family:Submit click">
                  {t('protected-application-intake-family:submit.submit')}
                </NavigationButton>
                <NavigationButtonLink
                  disabled={isSubmitting}
                  variant="secondary"
                  direction="previous"
                  routeId="protected/application/$id/intake-family/childrens-application"
                  params={params}
                  data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected-Intake_Family:Back click"
                >
                  {t('protected-application-intake-family:submit.children-application')}
                </NavigationButtonLink>
              </div>
            </fetcher.Form>
          </section>
        </div>
        <div className="mt-8">
          <InlineLink routeId="protected/application/$id/intake-family/exit-application" params={params}>
            {t('protected-application-intake-family:submit.exit-application')}
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
