import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';

import { loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.termsAndConditions,
  pageTitleI18nKey: 'apply:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request, params }: LoaderFunctionArgs) {
  loadApplyState({ params, session });
  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:terms-and-conditions.page-title') }) };

  return { csrfToken, meta };
}

export async function action({ context: { appContainer, session }, request, params }: ActionFunctionArgs) {
  const log = getLogger('apply/terms-and-conditions');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  saveApplyState({ params, session, state: {} });

  return redirect(getPathById('public/apply/$id/type-application', params));
}

export default function ApplyIndex() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const canadaTermsConditions = <InlineLink to={t('apply:terms-and-conditions.links.canada-ca-terms-and-conditions')} className="external-link" newTabIndicator target="_blank" />;
  const fileacomplaint = <InlineLink to={t('apply:terms-and-conditions.links.file-complaint')} className="external-link" newTabIndicator target="_blank" />;
  const hcaptchaTermsOfService = <InlineLink to={t('apply:terms-and-conditions.links.hcaptcha')} className="external-link" newTabIndicator target="_blank" />;
  const infosource = <InlineLink to={t('apply:terms-and-conditions.links.info-source')} className="external-link" newTabIndicator target="_blank" />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('apply:terms-and-conditions.links.microsoft-data-privacy-policy')} className="external-link" newTabIndicator target="_blank" />;
  const cite = <cite />;

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p>{t('apply:terms-and-conditions.intro-text')}</p>
        <Collapsible summary={t('apply:terms-and-conditions.terms-and-conditions-of-use.summary')}>
          <div className="space-y-6">
            <div className="space-y-4">
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application-legal-terms" components={{ canadaTermsConditions }} />
              </p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-access-terms')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-usage-terms')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-outage')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-timeout')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.terms-rejection-policy')}</p>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.esdc-definition-clarification')}</p>
            </div>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.heading')}</h2>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.self-agreement')}</li>
                <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.on-behalf-of-someone-else')}</li>
                <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.at-your-own-risk')}</li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application.msdc" components={{ microsoftDataPrivacyPolicy }} />
                </li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application.antibot" components={{ hcaptchaTermsOfService }} />
                </li>
              </ul>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold">{t('apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.heading')}</h2>
              <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
            </section>
          </div>
        </Collapsible>

        <Collapsible summary={t('apply:terms-and-conditions.privacy-notice-statement.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.privacy-notice-statement.personal-information.heading')}</h2>
              <p>{t('apply:terms-and-conditions.privacy-notice-statement.personal-information.service-canada-application-administration')}</p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.personal-information.collection-use" components={{ cite }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.personal-information.microsoft-policy" components={{ microsoftDataPrivacyPolicy, cite }} />
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
              <p>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.hc-ppu-440')}</li>
                <li>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.esdc-ppu-712')}</li>
              </ul>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.info-source-access" components={{ infosource }} />
              </p>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-handling-complaint-process" components={{ fileacomplaint }} />
              </p>
            </section>
          </div>
        </Collapsible>
        <Collapsible summary={t('apply:terms-and-conditions.sharing-your-information.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.heading')}</h2>
              <p>{t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.share-info')}</p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.disclose-info')}</p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.government-of-canada-and-sun-life.sun-life-authorization')}</p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.heading')}</h2>
              <p>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.enrol-consent" components={{ cite }} />
              </p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.considered-minor')}</p>
              <p>{t('apply:terms-and-conditions.sharing-your-information.sharing-of-information-and-oral-health-providers.analysis')}</p>
            </section>
          </div>
        </Collapsible>
      </div>
      <p className="my-8">{t('apply:terms-and-conditions.apply.application-participation')}</p>
      <p className="my-8" id="application-consent">
        {t('apply:terms-and-conditions.apply.application-consent')}
      </p>
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton
            aria-describedby="application-consent"
            variant="primary"
            id="continue-button"
            loading={isSubmitting}
            endIcon={faChevronRight}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Agree and Continue - Terms and Conditions click"
          >
            {t('apply:terms-and-conditions.apply.start-button')}
          </LoadingButton>
          <ButtonLink id="back-button" to={t('apply:terms-and-conditions.apply.link')} disabled={isSubmitting} startIcon={faChevronLeft} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Terms and Conditions click">
            {t('apply:terms-and-conditions.apply.back-button')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
