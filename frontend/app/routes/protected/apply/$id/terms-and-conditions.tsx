import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/terms-and-conditions';

import { TYPES } from '~/.server/constants';
import { loadProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import type { IdToken } from '~/.server/utils/raoidc.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputCheckbox } from '~/components/input-checkbox';
import { LoadingButton } from '~/components/loading-button';
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
  i18nNamespaces: getTypedI18nNamespaces('protected-apply', 'gcweb'),
  pageIdentifier: pageIds.protected.apply.termsAndConditions,
  pageTitleI18nKey: 'protected-apply:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => {
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { appContainer, session }, request, params }: Route.LoaderArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const state = loadProtectedApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-apply:terms-and-conditions.page-title') }) };

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('page-view.apply.terms-and-conditions', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.terms-and-conditions', 200);
  return { defaultState: state.termsAndConditions, meta };
}

export async function action({ context: { appContainer, session }, request, params }: Route.ActionArgs) {
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const consentSchema = z
    .object({
      acknowledgeTerms: z.string().trim().optional(),
      acknowledgePrivacy: z.string().trim().optional(),
      shareData: z.string().trim().optional(),
      doNotConsent: z.string().trim().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.doNotConsent) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply:terms-and-conditions.checkboxes.error-message.consent-required'), path: ['doNotConsent'] });
      }
      if (!val.doNotConsent && !val.acknowledgeTerms) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply:terms-and-conditions.checkboxes.error-message.acknowledge-terms-required'), path: ['acknowledgeTerms'] });
      }
      if (!val.doNotConsent && !val.acknowledgePrivacy) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply:terms-and-conditions.checkboxes.error-message.acknowledge-privacy-required'), path: ['acknowledgePrivacy'] });
      }
      if (!val.doNotConsent && !val.shareData) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('protected-apply:terms-and-conditions.checkboxes.error-message.share-data-required'), path: ['shareData'] });
      }
    })
    .transform((val) => ({
      acknowledgeTerms: val.acknowledgeTerms === CHECKBOX_VALUE.yes,
      acknowledgePrivacy: val.acknowledgePrivacy === CHECKBOX_VALUE.yes,
      shareData: val.shareData === CHECKBOX_VALUE.yes,
    }));

  const parsedDataResult = consentSchema.safeParse({
    acknowledgeTerms: formData.get('acknowledgeTerms') ?? '',
    acknowledgePrivacy: formData.get('acknowledgePrivacy') ?? '',
    shareData: formData.get('shareData') ?? '',
    doNotConsent: formData.get('doNotConsent') ?? '',
  });

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('protected.apply.terms-and-conditions', 400);
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveProtectedApplyState({
    params,
    session,
    state: {
      termsAndConditions: parsedDataResult.data,
    },
  });

  const idToken: IdToken = session.get('idToken');
  appContainer.get(TYPES.domain.services.AuditService).createAudit('update-data.apply.terms-and-conditions', { userId: idToken.sub });

  instrumentationService.countHttpStatus('protected.apply.terms-and-conditions', 302);
  return redirect(getPathById('protected/apply/$id/tax-filing', params));
}

export default function ProtectedApplyTermsAndConditions({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    acknowledgeTerms: 'input-checkbox-acknowledge-terms',
    acknowledgePrivacy: 'input-checkbox-acknowledge-privacy',
    shareData: 'input-checkbox-share-data',
    doNotConsent: 'input-checkbox-do-not-consent',
  });

  const canadaTermsConditions = <InlineLink to={t('protected-apply:terms-and-conditions.links.canada-ca-terms-and-conditions')} className="external-link" newTabIndicator target="_blank" />;
  const fileacomplaint = <InlineLink to={t('protected-apply:terms-and-conditions.links.file-complaint')} className="external-link" newTabIndicator target="_blank" />;
  const hcaptchaTermsOfService = <InlineLink to={t('protected-apply:terms-and-conditions.links.hcaptcha')} className="external-link" newTabIndicator target="_blank" />;
  const infosource = <InlineLink to={t('protected-apply:terms-and-conditions.links.info-source')} className="external-link" newTabIndicator target="_blank" />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('protected-apply:terms-and-conditions.links.microsoft-data-privacy-policy')} className="external-link" newTabIndicator target="_blank" />;
  const cite = <cite />;

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p>{t('protected-apply:terms-and-conditions.intro-text')}</p>
        <errorSummary.ErrorSummary />
        <Collapsible summary={t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.summary')}>
          <div className="space-y-6">
            <div className="space-y-4">
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application-legal-terms" components={{ canadaTermsConditions }} />
              </p>
              <p>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application-access-terms')}</p>
              <p>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application-usage-terms')}</p>
              <p>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application-outage')}</p>
              <p>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application-timeout')}</p>
              <p>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.terms-rejection-policy')}</p>
              <p>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.esdc-definition-clarification')}</p>
            </div>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application.heading')}</h2>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application.self-agreement')}</li>
                <li>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application.on-behalf-of-someone-else')}</li>
                <li>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application.at-your-own-risk')}</li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application.msdc" components={{ microsoftDataPrivacyPolicy }} />
                </li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.terms-and-conditions-of-use.online-application.antibot" components={{ hcaptchaTermsOfService }} />
                </li>
              </ul>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.heading')}</h2>
              <p>{t('protected-apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
            </section>
          </div>
        </Collapsible>

        <Collapsible summary={t('protected-apply:terms-and-conditions.privacy-notice-statement.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('protected-apply:terms-and-conditions.privacy-notice-statement.personal-information.heading')}</h2>
              <p>{t('protected-apply:terms-and-conditions.privacy-notice-statement.personal-information.service-canada-application-administration')}</p>
              <p>{t('protected-apply:terms-and-conditions.privacy-notice-statement.personal-information.policy-analysis')}</p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.privacy-notice-statement.personal-information.collection-use" components={{ cite }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.privacy-notice-statement.personal-information.microsoft-policy" components={{ microsoftDataPrivacyPolicy, cite }} />
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('protected-apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
              <p>{t('protected-apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('protected-apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.hc-ppu-440')}</li>
                <li>{t('protected-apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.esdc-ppu-712')}</li>
              </ul>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.info-source-access" components={{ infosource }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-handling-complaint-process" components={{ fileacomplaint }} />
              </p>
            </section>
          </div>
        </Collapsible>
        <Collapsible summary={t('protected-apply:terms-and-conditions.sharing-your-information.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('protected-apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.heading')}</h2>
              <p>{t('protected-apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.share-info')}</p>
              <p>{t('protected-apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.disclose-info')}</p>
              <p>{t('protected-apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.sun-life-authorization')}</p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('protected-apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.heading')}</h2>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.enrol-consent" components={{ cite }} />
              </p>
              <p>{t('protected-apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.considered-minor')}</p>
              <p>{t('protected-apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.analysis')}</p>
            </section>
          </div>
        </Collapsible>
      </div>
      <p className="my-8">{t('protected-apply:terms-and-conditions.apply.application-participation')}</p>
      <p className="my-8" id="application-consent">
        {t('protected-apply:terms-and-conditions.apply.application-consent')}
      </p>
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <InputCheckbox id="acknowledge-terms" name="acknowledgeTerms" value={CHECKBOX_VALUE.yes} defaultChecked={defaultState?.acknowledgeTerms} errorMessage={errors?.acknowledgeTerms} required>
          {t('protected-apply:terms-and-conditions.checkboxes.acknowledge-terms')}
        </InputCheckbox>
        <InputCheckbox id="acknowledge-privacy" name="acknowledgePrivacy" value={CHECKBOX_VALUE.yes} defaultChecked={defaultState?.acknowledgePrivacy} errorMessage={errors?.acknowledgePrivacy} required>
          {t('protected-apply:terms-and-conditions.checkboxes.acknowledge-privacy')}
        </InputCheckbox>
        <InputCheckbox id="share-data" name="shareData" value={CHECKBOX_VALUE.yes} defaultChecked={defaultState?.shareData} errorMessage={errors?.shareData} required>
          {t('protected-apply:terms-and-conditions.checkboxes.share-data')}
        </InputCheckbox>
        <InputCheckbox id="do-not-consent" name="doNotConsent" value={CHECKBOX_VALUE.yes} className="my-8" errorMessage={errors?.doNotConsent}>
          <Trans ns={handle.i18nNamespaces} i18nKey="protected-apply:terms-and-conditions.checkboxes.do-not-consent" />
        </InputCheckbox>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            aria-describedby="application-consent"
            variant="primary"
            id="continue-button"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Continue - Terms and Conditions click"
          >
            {t('protected-apply:terms-and-conditions.apply.continue-button')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            to={t('protected-apply:terms-and-conditions.apply.link')}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Protected:Back - Terms and Conditions click"
          >
            {t('protected-apply:terms-and-conditions.apply.back-button')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
