import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useLoaderData, useNavigation } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageTitleI18nKey: 'apply:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:terms-and-conditions.page-heading') }) };

  return json({ id, meta, state: state.termsAndConditions });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: {},
  });

  return redirectWithLocale(request, `/apply/${id}/type-of-application`, sessionResponseInit);
}

export default function TermsAndConditions() {
  const { id } = useLoaderData<typeof loader>();
  const { t } = useTranslation(handle.i18nNamespaces);
  const navigation = useNavigation();

  const fileacomplaint = <InlineLink to={t('apply:terms-and-conditions.links.file-complaint')} />;
  const hcaptchaTermsOfService = <InlineLink to={t('apply:terms-and-conditions.links.hcaptcha')} />;
  const infosource = <InlineLink to={t('apply:terms-and-conditions.links.info-source')} />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('apply:terms-and-conditions.links.microsoft-data-privacy-policy')} />;

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p>{t('apply:terms-and-conditions.intro-text')}</p>
        <Collapsible summary={t('apply:terms-and-conditions.terms-and-conditions-of-use.summary')}>
          <div className="space-y-4">
            <h2 className="font-bold">{t('apply:terms-and-conditions.terms-and-conditions-of-use.heading')}</h2>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application-legal-terms" />
            </p>
            <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-access-terms')}</p>
            <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application-usage-terms')}</p>
            <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.terms-rejection-policy')}</p>
            <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.esdc-definition-clarification')}</p>

            <h2 className="font-bold"> {t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.heading')}</h2>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.self-agreement')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.on-behalf-of-someone-else')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.at-your-own-risk')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.personal-information-usage-responsibility')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.only-use')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.maintenance')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.inactive')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.online-application.msdc')}</li>
              <li>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.terms-and-conditions-of-use.online-application.antibot" components={{ hcaptchaTermsOfService }} />
              </li>
            </ul>

            <h2 className="font-bold"> {t('apply:terms-and-conditions.terms-and-conditions-of-use.disclaimers.heading')}</h2>
            <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.disclaimers.online-application-disclaimer')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.disclaimers.external-factors-disclaimer')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.disclaimers.online-application-information-non-acceptance')}</li>
              <li>{t('apply:terms-and-conditions.terms-and-conditions-of-use.disclaimers.non-compliance')}</li>
            </ul>
            <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.disclaimers.esdc-liability-indemnification')}</p>

            <h2 className="font-bold">{t('apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.heading')}</h2>
            <p>{t('apply:terms-and-conditions.terms-and-conditions-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
          </div>
        </Collapsible>

        <Collapsible summary={t('apply:terms-and-conditions.privacy-notice-statement.summary')}>
          <div className="space-y-4">
            <h2 className="font-bold"> {t('apply:terms-and-conditions.privacy-notice-statement.personal-information.heading')}</h2>
            <p>{t('apply:terms-and-conditions.privacy-notice-statement.personal-information.service-canada-application-administration')}</p>

            <h2 className="font-bold"> {t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
            <p>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-collection-and-use-authorization')}</p>
            <p>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.file-hc-ppu-440')}</li>
            </ul>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.info-source-access" components={{ infosource }} />
            </p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.esdc-application-third-party-provider" components={{ microsoftDataPrivacyPolicy }} />
            </p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-handling-complaint-process" components={{ fileacomplaint }} />
            </p>

            <h2 className="font-bold"> {t('apply:terms-and-conditions.privacy-notice-statement.who-we-can-share-your-information-with.heading')}</h2>
            <p>{t('apply:terms-and-conditions.privacy-notice-statement.who-we-can-share-your-information-with.esdc-personal-information-sharing')}</p>
            <p>{t('apply:terms-and-conditions.privacy-notice-statement.who-we-can-share-your-information-with.benefits-administration-data-disclosure')}</p>
            <p>{t('apply:terms-and-conditions.privacy-notice-statement.who-we-can-share-your-information-with.esdc-information-usage-policy')}</p>

            <h2 className="font-bold">{t('apply:terms-and-conditions.privacy-notice-statement.what-happens-if-you-dont-give-us-your-information-heading')} </h2>
            <p>{t('apply:terms-and-conditions.privacy-notice-statement.what-happens-if-you-dont-give-us-your-information-text')}</p>
          </div>
        </Collapsible>
      </div>
      <h2 className="my-8 font-lato text-2xl font-bold">{t('apply:terms-and-conditions.apply-now.heading')}</h2>
      <p>{t('apply:terms-and-conditions.apply-now.application-start-consent')}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to="/apply" className={cn(navigation.state !== 'idle' && 'pointer-events-none')}>
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply:terms-and-conditions.apply-now.back-button')}
        </ButtonLink>
        <ButtonLink variant="primary" id="continue-button" to={`/apply/${id}/type-of-application`}>
          {t('apply:terms-and-conditions.apply-now.start-button')}
          <FontAwesomeIcon icon={navigation.state !== 'idle' ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', navigation.state !== 'idle' && 'animate-spin')} />
        </ButtonLink>
      </div>
    </div>
  );
}
