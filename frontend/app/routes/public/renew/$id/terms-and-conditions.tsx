import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'gcweb'),
  pageIdentifier: pageIds.public.renew.termsAndConditions,
  pageTitleI18nKey: 'renew:terms-and-conditions.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request, params }: LoaderFunctionArgs) {
  loadRenewState({ params, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:terms-and-conditions.page-title') }) };

  return { meta };
}

export async function action({ context: { appContainer, session }, request, params }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  saveRenewState({ params, session, state: {} });

  return redirect(getPathById('public/renew/$id/applicant-information', params));
}

export default function RenewTermsAndConditions() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const canadaTermsConditions = <InlineLink to={t('renew:terms-and-conditions.links.canada-ca-terms-and-conditions')} className="external-link" newTabIndicator target="_blank" />;
  const fileacomplaint = <InlineLink to={t('renew:terms-and-conditions.links.file-complaint')} className="external-link" newTabIndicator target="_blank" />;
  const hcaptchaTermsOfService = <InlineLink to={t('renew:terms-and-conditions.links.hcaptcha')} className="external-link" newTabIndicator target="_blank" />;
  const infosource = <InlineLink to={t('renew:terms-and-conditions.links.info-source')} className="external-link" newTabIndicator target="_blank" />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('renew:terms-and-conditions.links.microsoft-data-privacy-policy')} className="external-link" newTabIndicator target="_blank" />;
  const cite = <cite />;

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p>{t('renew:terms-and-conditions.intro-text')}</p>
        <Collapsible summary={t('renew:terms-and-conditions.terms-and-conditions-of-use.summary')}>
          <div className="space-y-6">
            <div className="space-y-4">
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.terms-and-conditions-of-use.online-application-legal-terms" components={{ canadaTermsConditions }} />
              </p>
              <p>{t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application-access-terms')}</p>
              <p>{t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application-usage-terms')}</p>
              <p>{t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application-outage')}</p>
              <p>{t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application-timeout')}</p>
              <p>{t('renew:terms-and-conditions.terms-and-conditions-of-use.terms-rejection-policy')}</p>
              <p>{t('renew:terms-and-conditions.terms-and-conditions-of-use.esdc-definition-clarification')}</p>
            </div>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application.heading')}</h2>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application.self-agreement')}</li>
                <li>{t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application.on-behalf-of-someone-else')}</li>
                <li>{t('renew:terms-and-conditions.terms-and-conditions-of-use.online-application.at-your-own-risk')}</li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.terms-and-conditions-of-use.online-application.msdc" components={{ microsoftDataPrivacyPolicy }} />
                </li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.terms-and-conditions-of-use.online-application.antibot" components={{ hcaptchaTermsOfService }} />
                </li>
              </ul>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('renew:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.heading')}</h2>
              <p>{t('renew:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
            </section>
          </div>
        </Collapsible>

        <Collapsible summary={t('renew:terms-and-conditions.privacy-notice-statement.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('renew:terms-and-conditions.privacy-notice-statement.personal-information.heading')}</h2>
              <p>{t('renew:terms-and-conditions.privacy-notice-statement.personal-information.service-canada-application-administration')}</p>
              <p>{t('renew:terms-and-conditions.privacy-notice-statement.personal-information.share-information')}</p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.privacy-notice-statement.personal-information.collection-use" components={{ cite }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.privacy-notice-statement.personal-information.microsoft-policy" components={{ microsoftDataPrivacyPolicy, cite }} />
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('renew:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
              <p>{t('renew:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('renew:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.hc-ppu-440')}</li>
                <li>{t('renew:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.esdc-ppu-712')}</li>
              </ul>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.info-source-access" components={{ infosource }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-handling-complaint-process" components={{ fileacomplaint }} />
              </p>
              <p className="my-8">{t('renew:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.application-participation')}</p>
            </section>
          </div>
        </Collapsible>
        <Collapsible summary={t('renew:terms-and-conditions.sharing-your-information.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('renew:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.heading')}</h2>
              <p>{t('renew:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.share-info')}</p>
              <p>{t('renew:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.disclose-info')}</p>
              <p>{t('renew:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.sun-life-authorization')}</p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('renew:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.heading')}</h2>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="renew:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.enrol-consent" components={{ cite }} />
              </p>
              <p>{t('renew:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.considered-minor')}</p>
            </section>
          </div>
        </Collapsible>
      </div>
      <p className="my-8" id="application-consent">
        {t('renew:terms-and-conditions.apply.application-consent')}
      </p>
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            aria-describedby="application-consent"
            variant="primary"
            id="continue-button"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Agree and Continue - Terms and Conditions click"
          >
            {t('renew:terms-and-conditions.apply.start-button')}
          </LoadingButton>
          <ButtonLink id="back-button" to={t('renew:terms-and-conditions.apply.link')} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Back - Terms and Conditions click">
            {t('renew:terms-and-conditions.apply.back-button')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
