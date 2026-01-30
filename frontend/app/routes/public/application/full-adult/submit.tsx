import { data, redirect, useFetcher } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/submit';

import { TYPES } from '~/.server/constants';
import { loadPublicApplicationFullAdultStateForReview } from '~/.server/routes/helpers/public-application-full-adult-route-helpers';
import { savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { DebugPayload } from '~/components/debug-payload';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { NavigationButton, NavigationButtonLink } from '~/components/navigation-buttons';
import { pageIds } from '~/page-ids';
import { ProgressStepper } from '~/routes/public/application/full-adult/progress-stepper';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const CHECKBOX_VALUE = {
  yes: 'yes',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application', 'application-full-adult', 'gcweb'),
  pageIdentifier: pageIds.public.application.newAdult.submit,
  pageTitleI18nKey: 'application-full-adult:submit.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = loadPublicApplicationFullAdultStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-full-adult:submit.page-title') }) };

  const { ENABLED_FEATURES } = appContainer.get(TYPES.ClientConfig);

  const viewPayloadEnabled = ENABLED_FEATURES.includes('view-payload');
  const benefitApplicationDtoMapper = appContainer.get(TYPES.BenefitApplicationDtoMapper);
  const benefitApplicationStateMapper = appContainer.get(TYPES.HubSpokeBenefitApplicationStateMapper);
  const payload = viewPayloadEnabled && benefitApplicationDtoMapper.mapBenefitApplicationDtoToBenefitApplicationRequestEntity(benefitApplicationStateMapper.mapApplicationAdultStateToBenefitApplicationDto(state));

  return {
    state: {
      applicantName: `${state.applicantInformation.firstName} ${state.applicantInformation.lastName}`,
    },
    meta,
    payload,
  };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  const state = loadPublicApplicationFullAdultStateForReview({ params, request, session });
  validateApplicationFlow(state, params, ['full-adult']);

  const formData = await request.formData();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const submitTermsSchema = z.object({
    acknowledgeInfo: z.literal(true, { error: t('application-full-adult:submit.error-message.acknowledge-info-required') }),
    acknowledgeCriteria: z.literal(true, { error: t('application-full-adult:submit.error-message.acknowledge-criteria-required') }),
  });

  const parsedDataResult = submitTermsSchema.safeParse({
    acknowledgeInfo: formData.get('acknowledgeInfo')?.toString() === CHECKBOX_VALUE.yes,
    acknowledgeCriteria: formData.get('acknowledgeCriteria')?.toString() === CHECKBOX_VALUE.yes,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const benefitApplicationDto = appContainer.get(TYPES.HubSpokeBenefitApplicationStateMapper).mapApplicationAdultStateToBenefitApplicationDto(state);
  const confirmationCode = await appContainer.get(TYPES.BenefitApplicationService).createBenefitApplication(benefitApplicationDto);
  const submissionInfo = { confirmationCode, submittedOn: new UTCDate().toISOString() };
  savePublicApplicationState({ params, session, state: { submitTerms: parsedDataResult.data, submissionInfo } });

  return redirect(getPathById('public/application/$id/full-adult/confirmation', params));
}

export default function NewAdultSubmit({ loaderData, params }: Route.ComponentProps) {
  const { state, payload } = loaderData;
  const { t } = useTranslation(handle.i18nNamespaces);

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    acknowledgeInfo: 'input-checkbox-acknowledge-info',
    acknowledgeCriteria: 'input-checkbox-acknowledge-criteria',
  });

  const eligibilityLink = <InlineLink to={t('application-full-adult:submit.do-you-qualify.href')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <>
      <ProgressStepper activeStep="submit" className="mb-8" />
      <div className="max-w-prose space-y-8">
        <errorSummary.ErrorSummary />
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-full-adult:submit.overview')}</h2>
            <div>
              <p>{t('application-full-adult:submit.you-are-submitting')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{state.applicantName}</li>
              </ul>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-full-adult:submit.review-your-application')}</h2>
            <p>{t('application-full-adult:submit.please-review')}</p>
            <ButtonLink variant="primary" routeId="public/application/$id/full-adult/marital-status" params={params}>
              {t('application-full-adult:submit.review-application')}
            </ButtonLink>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-3xl leading-none font-bold">{t('application-full-adult:submit.submit-your-application')}</h2>
            <p>{t('application-full-adult:submit.by-submitting')}</p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="application-full-adult:submit.review-eligibility-criteria" components={{ eligibilityLink }} />
            </p>
            <fetcher.Form method="post" noValidate>
              <CsrfTokenInput />
              <div className="space-y-2">
                <InputCheckbox id="acknowledge-info" name="acknowledgeInfo" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeInfo} required>
                  {t('application-full-adult:submit.info-is-correct')}
                </InputCheckbox>
                <InputCheckbox id="acknowledge-criteria" name="acknowledgeCriteria" value={CHECKBOX_VALUE.yes} errorMessage={errors?.acknowledgeCriteria} required>
                  {t('application-full-adult:submit.i-understand')}
                </InputCheckbox>
              </div>
              <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
                <NavigationButton disabled={isSubmitting} variant="primary" direction="next">
                  {t('application-full-adult:submit.submit')}
                </NavigationButton>
                <NavigationButtonLink variant="secondary" direction="previous" routeId="public/application/$id/full-adult/dental-insurance" params={params}>
                  {t('application-full-adult:submit.dental-insurance')}
                </NavigationButtonLink>
              </div>
            </fetcher.Form>
          </section>
        </div>
        <div className="mt-8">
          <InlineLink routeId="public/application/$id/full-adult/exit-application" params={params}>
            {t('application-full-adult:submit.exit-application')}
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
