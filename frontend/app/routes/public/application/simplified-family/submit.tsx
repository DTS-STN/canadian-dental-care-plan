import { data, redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/submit';

import { TYPES } from '~/.server/constants';
import { savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { loadPublicApplicationSimplifiedFamilyStateForReview } from '~/.server/routes/helpers/public-application-simplified-family-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DebugPayload } from '~/components/debug-payload';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { NavigationButton, NavigationButtonLink } from '~/components/navigation-buttons';
import { ProgressStepper } from '~/components/progress-stepper';
import { useProgressStepper } from '~/hooks/use-progress-stepper';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const CHECKBOX_VALUE = {
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-simplified-family', 'gcweb'),
  pageIdentifier: pageIds.public.application.renewFamily.submit,
  pageTitleI18nKey: 'application-simplified-family:submit.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationSimplifiedFamilyStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-simplified-family:submit.page-title') }) };

  const children = [];
  for (const child of state.children) {
    children.push(`${child.information.firstName} ${child.information.lastName}`);
  }

  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationDtoMapper = appContainer.get(TYPES.BenefitRenewalDtoMapper);
  const benefitApplicationStateMapper = appContainer.get(TYPES.HubSpokeBenefitRenewalStateMapper);
  const payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapAdultChildBenefitRenewalDtoToBenefitRenewalRequestEntity(benefitApplicationStateMapper.mapBenefitRenewalAdultChildStateToAdultChildBenefitRenewalDto(state));

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
  const state = loadPublicApplicationSimplifiedFamilyStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['simplified-family']);

  const formData = await request.formData();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const submitTermsSchema = z.object({
    acknowledgeInfo: z.literal(true, { error: t('application-simplified-family:submit.error-message.acknowledge-info-required') }),
    acknowledgeCriteria: z.literal(true, { error: t('application-simplified-family:submit.error-message.acknowledge-criteria-required') }),
  });

  const parsedDataResult = submitTermsSchema.safeParse({
    acknowledgeInfo: formData.get('acknowledgeInfo')?.toString() === CHECKBOX_VALUE.yes,
    acknowledgeCriteria: formData.get('acknowledgeCriteria')?.toString() === CHECKBOX_VALUE.yes,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const benefitApplicationDto = appContainer.get(TYPES.HubSpokeBenefitRenewalStateMapper).mapBenefitRenewalAdultChildStateToAdultChildBenefitRenewalDto(state);
  const confirmationCode = await appContainer.get(TYPES.BenefitRenewalService).createAdultChildBenefitRenewal(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };
  savePublicApplicationState({ params, session, state: { submitTerms: parsedDataResult.data, submissionInfo } });

  return redirect(getPathById('public/application/$id/simplified-family/confirmation', params));
}

export default function SimplifiedFamilySubmit({ loaderData, params }: Route.ComponentProps) {
  const { state, payload } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);
  const { steps, currentStep } = useProgressStepper('simplified-family', 'submit');

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    acknowledgeInfo: 'input-checkbox-acknowledge-info',
    acknowledgeCriteria: 'input-checkbox-acknowledge-criteria',
  });

  const eligibilityLink = <InlineLink to={t('application-simplified-family:submit.do-you-qualify.href')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <>
      <div className="max-w-prose space-y-8">
        <errorSummary.ErrorSummary />
        <ProgressStepper steps={steps} currentStep={currentStep} />
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-simplified-family:submit.overview')}</h2>
            <div>
              <p>{t('application-simplified-family:submit.you-are-submitting')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{state.applicantName}</li>
                {state.children.map((child, index) => (
                  <li key={index}>{child}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-simplified-family:submit.review-your-application')}</h2>
            <p>{t('application-simplified-family:submit.please-review')}</p>
            <ButtonLink variant="primary" routeId="public/application/$id/simplified-family/contact-information" params={params}>
              {t('application-simplified-family:submit.review-application')}
            </ButtonLink>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-simplified-family:submit.submit-your-application')}</h2>
            <p>{t('application-simplified-family:submit.by-submitting')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="application-simplified-family:submit.review-eligibility-criteria" components={{ eligibilityLink }} />
            </p>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <div className="space-y-2">
                <InputCheckbox id="acknowledge-info" name="acknowledgeInfo" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeInfo} required>
                  {t('application-simplified-family:submit.info-is-correct')}
                </InputCheckbox>
                <InputCheckbox id="acknowledge-criteria" name="acknowledgeCriteria" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeCriteria} required>
                  {t('application-simplified-family:submit.i-understand')}
                </InputCheckbox>
              </div>
              <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
                <NavigationButton disabled={isSubmitting} variant="primary" direction="next">
                  {t('application-simplified-family:submit.submit')}
                </NavigationButton>
                <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/simplified-family/childrens-application" params={params}>
                  {t('application-simplified-family:submit.childrens-application')}
                </NavigationButtonLink>
              </div>
            </fetcher.Form>
          </section>
        </div>
        <div className="mt-8">
          <InlineLink routeId="public/application/$id/simplified-family/exit-application" params={params}>
            {t('application-simplified-family:submit.exit-application')}
          </InlineLink>
        </div>
      </div>
      {payload && (
        <div className="mt-8">
          <DebugPayload data={payload} enableCopy />
        </div>
      )}
    </>
  );
}
