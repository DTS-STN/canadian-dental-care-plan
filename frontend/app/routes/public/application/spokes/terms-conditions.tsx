import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/terms-conditions';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { ErrorSummaryProvider } from '~/components/error-summary-context';
import { ErrorSummary } from '~/components/future-error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { LoadingButton } from '~/components/loading-button';
import { useFetcherSubmissionState } from '~/hooks';
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
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.termsConditions,
  pageTitleI18nKey: 'application-spokes:terms-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:terms-conditions.page-title') }) };
  return { defaultState: state.termsAndConditions, meta };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  getPublicApplicationState({ params, session });

  const formData = await request.formData();
  const t = await getFixedT(request, handle.i18nNamespaces);

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const consentSchema = z
    .object({
      acknowledgeTerms: z.string().trim().optional(),
      acknowledgePrivacy: z.string().trim().optional(),
      shareData: z.string().trim().optional(),
      doNotConsent: z.string().trim().optional(),
    })

    .superRefine((val, ctx) => {
      if (val.doNotConsent) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:terms-conditions.checkboxes.error-message.consent-required'), path: ['doNotConsent'] });
      }
      if (!val.doNotConsent && !val.acknowledgeTerms) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:terms-conditions.checkboxes.error-message.acknowledge-terms-required'), path: ['acknowledgeTerms'] });
      }
      if (!val.doNotConsent && !val.acknowledgePrivacy) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:terms-conditions.checkboxes.error-message.acknowledge-privacy-required'), path: ['acknowledgePrivacy'] });
      }
      if (!val.doNotConsent && !val.shareData) {
        ctx.addIssue({ code: 'custom', message: t('application-spokes:terms-conditions.checkboxes.error-message.share-data-required'), path: ['shareData'] });
      }
    })
    .transform((val) => ({
      acknowledgeTerms: val.acknowledgeTerms === CHECKBOX_VALUE.yes,
      acknowledgePrivacy: val.acknowledgePrivacy === CHECKBOX_VALUE.yes,
      shareData: val.shareData === CHECKBOX_VALUE.yes,
      doNotConsent: val.doNotConsent === CHECKBOX_VALUE.yes,
    }));

  const parsedDataResult = consentSchema.safeParse({
    acknowledgeTerms: formData.get('acknowledgeTerms') ?? '',
    acknowledgePrivacy: formData.get('acknowledgePrivacy') ?? '',
    shareData: formData.get('shareData') ?? '',
    doNotConsent: formData.get('doNotConsent') ?? '',
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({ params, session, state: { termsAndConditions: parsedDataResult.data } });
  return redirect(getPathById('public/application/$id/eligibility-requirements', params));
}

export default function ApplyIndex({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const { isSubmitting } = useFetcherSubmissionState(fetcher);

  const errors = fetcher.data?.errors;

  const esdcPib = <InlineLink to={t('application-spokes:terms-conditions.links.esdc-pib')} className="external-link" newTabIndicator target="_blank" />;
  const hcPib = <InlineLink to={t('application-spokes:terms-conditions.links.hc-pib')} className="external-link" newTabIndicator target="_blank" />;

  const canadaTermsConditions = <InlineLink to={t('application-spokes:terms-conditions.links.canada-ca-terms-and-conditions')} className="external-link" newTabIndicator target="_blank" />;
  const contactServiceCanada = <InlineLink to={t('application-spokes:terms-conditions.links.service-canada')} className="external-link" newTabIndicator target="_blank" />;
  const eligibilityRequirements = <InlineLink to={t('application-spokes:terms-conditions.links.eligibility-requirements')} className="external-link" newTabIndicator target="_blank" />;
  const fileacomplaint = <InlineLink to={t('application-spokes:terms-conditions.links.file-complaint')} className="external-link" newTabIndicator target="_blank" />;
  const hcaptchaTermsOfService = <InlineLink to={t('application-spokes:terms-conditions.links.hcaptcha')} className="external-link" newTabIndicator target="_blank" />;
  const infosource = <InlineLink to={t('application-spokes:terms-conditions.links.info-source')} className="external-link" newTabIndicator target="_blank" />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('application-spokes:terms-conditions.links.microsoft-data-privacy-policy')} className="external-link" newTabIndicator target="_blank" />;
  const cdcpPrivacyPolicy = <InlineLink to={t('application-spokes:terms-conditions.links.cdcp-privacy-policy')} className="external-link" newTabIndicator target="_blank" />;
  const cite = <cite />;

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p className="font-bold">{t('application-spokes:terms-conditions.before-you-begin')}</p>
        <ul className="list-disc space-y-1 pl-7">
          <li>
            <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.review-confirm" components={{ eligibilityRequirements }} />
          </li>
          <li>{t('application-spokes:terms-conditions.resolve-actions')}</li>
          <li>{t('application-spokes:terms-conditions.review-statements')}</li>
        </ul>
        <Collapsible summary={t('application-spokes:terms-conditions.terms-and-conditions-of-use.summary')}>
          <div className="space-y-6">
            <div className="space-y-4">
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.terms-and-conditions-of-use.online-application-legal-terms" components={{ canadaTermsConditions }} />
              </p>
              <p>{t('application-spokes:terms-conditions.terms-and-conditions-of-use.esdc-definition-clarification')}</p>
            </div>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.heading')}</h2>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.self-agreement')}</li>
                <li>{t('application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.timeout')}</li>
                <li>{t('application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.incorrect-information')}</li>
                <li>{t('application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.on-behalf-of-someone-else')}</li>
                <li>{t('application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.at-your-own-risk')}</li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.msdc" components={{ microsoftDataPrivacyPolicy }} />
                </li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.terms-and-conditions-of-use.online-application.antibot" components={{ hcaptchaTermsOfService }} />
                </li>
              </ul>
            </section>
            <section className="space-y-4">
              <p>{t('application-spokes:terms-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
            </section>
          </div>
        </Collapsible>

        <Collapsible summary={t('application-spokes:terms-conditions.privacy-notice-statement.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('application-spokes:terms-conditions.privacy-notice-statement.personal-information.heading')}</h2>
              <p>{t('application-spokes:terms-conditions.privacy-notice-statement.personal-information.service-canada-application-administration')}</p>
              <p>{t('application-spokes:terms-conditions.privacy-notice-statement.personal-information.service-canada-information-collection')}</p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.personal-information.participation" components={{ contactServiceCanada }} />
              </p>
              <p>{t('application-spokes:terms-conditions.privacy-notice-statement.personal-information.policy-analysis')}</p>
              <p>{t('application-spokes:terms-conditions.privacy-notice-statement.personal-information.digital-communications')}</p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.personal-information.collection-use" components={{ cite }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.personal-information.microsoft-policy" components={{ microsoftDataPrivacyPolicy, cite }} />
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
              <p>{t('application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.hc-ppu-440" components={{ hcPib }} />
                </li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.esdc-ppu-712" components={{ esdcPib }} />
                </li>
              </ul>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.info-source-access" components={{ infosource }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.privacy-contact" components={{ contactServiceCanada }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-handling-complaint-process" components={{ fileacomplaint }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.privacy-notice-statement.how-we-protect-your-privacy.privacy-protection" components={{ cdcpPrivacyPolicy }} />
              </p>
            </section>
          </div>
        </Collapsible>
        <Collapsible summary={t('application-spokes:terms-conditions.sharing-your-information.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('application-spokes:terms-conditions.sharing-your-information.government-of-canada-and-sun-life.heading')}</h2>
              <p>{t('application-spokes:terms-conditions.sharing-your-information.government-of-canada-and-sun-life.share-info')}</p>
              <p>{t('application-spokes:terms-conditions.sharing-your-information.government-of-canada-and-sun-life.policy-analysis')}</p>
              <p>{t('application-spokes:terms-conditions.sharing-your-information.government-of-canada-and-sun-life.send-letters')}</p>
              <p>{t('application-spokes:terms-conditions.sharing-your-information.government-of-canada-and-sun-life.disclose-info')}</p>
              <p>{t('application-spokes:terms-conditions.sharing-your-information.government-of-canada-and-sun-life.sun-life-authorization')}</p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('application-spokes:terms-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.heading')}</h2>
              <p>{t('application-spokes:terms-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.enrol-consent')}</p>
              <p>{t('application-spokes:terms-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.considered-minor')}</p>
            </section>
          </div>
        </Collapsible>
      </div>
      <p className="my-8" id="application-consent">
        {t('application-spokes:terms-conditions.apply.application-consent')}
      </p>
      <ErrorSummaryProvider actionData={fetcher.data}>
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <ErrorSummary />
          <div className="space-y-2">
            <InputCheckbox id="acknowledge-terms" name="acknowledgeTerms" value={CHECKBOX_VALUE.yes} defaultChecked={defaultState?.acknowledgeTerms} errorMessage={errors?.acknowledgeTerms} required>
              {t('application-spokes:terms-conditions.checkboxes.acknowledge-terms')}
            </InputCheckbox>
            <InputCheckbox id="acknowledge-privacy" name="acknowledgePrivacy" value={CHECKBOX_VALUE.yes} defaultChecked={defaultState?.acknowledgePrivacy} errorMessage={errors?.acknowledgePrivacy} required>
              {t('application-spokes:terms-conditions.checkboxes.acknowledge-privacy')}
            </InputCheckbox>
            <InputCheckbox id="share-data" name="shareData" value={CHECKBOX_VALUE.yes} defaultChecked={defaultState?.shareData} errorMessage={errors?.shareData} required>
              {t('application-spokes:terms-conditions.checkboxes.share-data')}
            </InputCheckbox>
          </div>
          <InputCheckbox id="do-not-consent" name="doNotConsent" value={CHECKBOX_VALUE.yes} className="my-8" errorMessage={errors?.doNotConsent}>
            <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:terms-conditions.checkboxes.do-not-consent" />
          </InputCheckbox>
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton aria-describedby="application-consent" variant="primary" id="continue-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Terms and Conditions click">
              {t('application-spokes:terms-conditions.apply.continue-button')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="public/application/$id/eligibility-requirements"
              params={params}
              disabled={isSubmitting}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Terms and Conditions click"
            >
              {t('application-spokes:terms-conditions.apply.back-button')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </ErrorSummaryProvider>
    </div>
  );
}
