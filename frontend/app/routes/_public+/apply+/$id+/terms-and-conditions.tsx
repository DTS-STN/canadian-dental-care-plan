import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { MetaFunction, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { CollapsibleDetails } from '~/components/collapsible';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('terms-and-conditions', 'gcweb'),
  pageTitleI18nKey: 'terms-and-conditions:terms-and-conditions.index.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('terms-and-conditions:terms-and-conditions.index.page-heading') }) }];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  return json({ id, state: state.termsAndConditions });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: {},
  });

  return redirect(`/apply/${id}/type-of-application`, sessionResponseInit);
}

export default function TermsAndConditions() {
  const { id } = useLoaderData<typeof loader>();
  const { t } = useTranslation(handle.i18nNamespaces);

  const hcaptchaTermsOfService = <InlineLink to="https://www.hcaptcha.com/terms" />;
  const infosource = <InlineLink to="https://www.canada.ca/en/employment-social-development/corporate/transparency/access-information/reports/infosource.html?utm_campaign=not-applicable&utm_medium=vanity-url&utm_source=canada-ca_infosource-esdc" />;
  const microsoftDataPrivacyPolicy = <InlineLink to="https://www.microsoft.com/en-ca/trust-center/privacy" />;
  const fileacomplaint = <InlineLink to="https://www.priv.gc.ca/en/report-a-concern/" />;

  return (
    <>
      <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.intro-text')}</p>
      <CollapsibleDetails id="collapsable-description-first-part" summary={t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-heading')}>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-one')}</p>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-two')}</p>
        <p className="mb-6">
          <strong>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-three-bold')}</strong>
          {t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-three-text')}
        </p>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-four')}</p>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-five')}</p>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-six')}</p>

        <h2 className="font-bold"> {t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-heading')}</h2>
        <ul className="mb-6 list-disc pl-10">
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-self-agreement')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-on-behalf-of-someone-else')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-at-your-own-risk')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-only-use')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-maintenance')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-inactive')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-msdc')}</li>
          <li>
            <Trans ns={handle.i18nNamespaces} i18nKey="terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-antibot" components={{ hcaptchaTermsOfService }} />
          </li>
        </ul>

        <h2 className="font-bold"> {t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-heading')}</h2>
        <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-text')}</p>
        <ul className="mb-6 list-disc pl-10">
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-bullet-one')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-bullet-two')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-bullet-three')}</li>
        </ul>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-text-continued')}</p>

        <h2 className="font-bold">{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-changes-to-these-terms-of-use-heading')}</h2>
        <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-changes-to-these-terms-of-use-text')}</p>
      </CollapsibleDetails>

      <CollapsibleDetails id="collapsable-description-second-part" summary={t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-heading')}>
        <h2 className="font-bold"> {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-personal-information-heading')}</h2>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-personal-information-text')}</p>

        <h2 className="font-bold"> {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-heading')}</h2>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-one')}</p>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-two')}</p>
        <ul className="mb-6 list-disc space-y-2 pl-10">
          <li>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-bullet-one')}</li>
        </ul>

        <p className="mb-6">
          <Trans ns={handle.i18nNamespaces} i18nKey="terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-three" components={{ infosource }} />
        </p>
        <p className="mb-6">
          <Trans ns={handle.i18nNamespaces} i18nKey="terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-four" components={{ microsoftDataPrivacyPolicy }} />
        </p>
        <p className="mb-6">
          <Trans ns={handle.i18nNamespaces} i18nKey="terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-five" components={{ fileacomplaint }} />
        </p>

        <h2 className="font-bold"> {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-heading')}</h2>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-text-part-one')}</p>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-text-part-two')}</p>
        <p className="mb-6">{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-text-part-three')}</p>

        <h2 className="font-bold">{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-what-happens-if-you-dont-give-us-your-information-heading')} </h2>
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-what-happens-if-you-dont-give-us-your-information-text')}</p>
      </CollapsibleDetails>
      <p className="mb-4 mt-2">{t('terms-and-conditions:terms-and-conditions.index.apply-now.text')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={`/apply`}>
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('terms-and-conditions:terms-and-conditions.index.apply-now.back-button')}
        </ButtonLink>
        <ButtonLink variant="primary" id="continue-button" to={`/apply/${id}/type-of-application`}>
          {t('terms-and-conditions:terms-and-conditions.index.apply-now.start-button')}
          <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
        </ButtonLink>
      </div>
    </>
  );
}
