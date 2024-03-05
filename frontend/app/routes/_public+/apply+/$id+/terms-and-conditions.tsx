import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { CollapsibleDetails } from '~/components/collapsible';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('terms-and-conditions');

export const handle = {
  breadcrumbs: [
    {
      labelI18nKey: 'terms-and-conditions:terms-and-conditions.index.breadcrumbs.terms-and-conditions',
    },
  ],
  i18nNamespaces,
  pageIdentifier: '00',
  pageTitleI18nKey: 'terms-and-conditions:terms-and-conditions.index.page-title',
} as const satisfies RouteHandleData;

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

  return redirect(`/apply/${id}/personal-info`, sessionResponseInit);
}

export default function TermsAndConditions() {
  const { id, state } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p className="text-xl">{t('terms-and-conditions:terms-and-conditions.index.intro-text')}</p>
      <br />
      <CollapsibleDetails id="collapsable-description-first-part" summary={t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-title')}>
        <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-one')}</p>
        <br />
        <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-two')}</p>
        <br />
        <p>
          <strong>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-three-bold')}</strong>
          {t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-three-text')}
        </p>
        <br />
        <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-four')}</p>
        <br />
        <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-five')}</p>
        <br />
        <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-part-six')}</p>
        <br />
        <strong>
          <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-title')}</p>
        </strong>
        <br />
        <ul className="list-disc space-y-2 pl-10">
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-one')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-two')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-three')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-four')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-five')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-six')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-seven')}</li>
          <li>
            {t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-eight')}
            <InlineLink to={`https://www.hcaptcha.com/terms`} className="font-lato font-semibold">
              {t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-terms-of-use-of-the-online-application-bullet-eight-link-text')}
            </InlineLink>
          </li>
        </ul>
        <br />
        <p>
          <strong>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-title')}</strong>
        </p>
        <br /> <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-text')}</p>
        <br />
        <ul className="list-disc space-y-2 pl-10">
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-bullet-one')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-bullet-two')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-bullet-three')}</li>
        </ul>
        <br /> <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-disclaimers-text-continued')}</p>
        <strong>
          <br /> <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-changes-to-these-terms-of-use-title')}</p>
        </strong>
        <br /> <p>{t('terms-and-conditions:terms-and-conditions.index.terms-and-conditions-of-use-changes-to-these-terms-of-use-text')}</p>
        <br />
      </CollapsibleDetails>
      <br />
      <CollapsibleDetails id="collapsable-description-second-part" summary={t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-title')}>
        <p>
          <strong>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-personal-information-title')}</strong>
        </p>
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-personal-information-text')}</p>
        <br />
        <p>
          <strong>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-title')}</strong>
        </p>
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-one')}</p>
        <br />
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-two')}</p>
        <br />
        <ul className="list-disc space-y-2 pl-10">
          <li>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-bullet-one')}</li>
          <li>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-bullet-two')}</li>
        </ul>
        <br />
        <p>
          {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-three-part-1')}
          <InlineLink
            to={`https://www.canada.ca/en/employment-social-development/corporate/transparency/access-information/reports/infosource.html?utm_campaign=not-applicable&utm_medium=vanity-url&utm_source=canada-ca_infosource-esdc`}
            className="font-lato font-semibold"
          >
            {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-three-part-1-link-text')}
          </InlineLink>
          {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-three-part-2')}
        </p>
        <br />
        <p>
          {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-four')}
          <InlineLink to={`https://www.microsoft.com/en-ca/trust-center/privacy`} className="font-lato font-semibold">
            {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-four-link-text')}
          </InlineLink>
        </p>
        <br />
        <p>
          {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-five')}
          <InlineLink to={`https://www.figma.com/file/pXiZz8YkzcMY5S5aq0B4ce/CDCP-Online-Application-Prototype?type=design&node-id=3091-43199&mode=design&t=HrfyDoQ3uFrjD1Zh-4`} className="font-lato font-semibold">
            {t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-how-we-protect-your-privacy-text-part-five-link-text')}
          </InlineLink>
        </p>
        <br />
        <p>
          <strong>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-title')}</strong>
        </p>
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-text-part-one')}</p>
        <br />
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-text-part-two')}</p>
        <br />
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-who-we-can-share-your-information-with-text-part-three')}</p>
        <br />
        <strong>
          <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-what-happens-if-you-dont-give-us-your-information-title')}</p>
        </strong>
        <p>{t('terms-and-conditions:terms-and-conditions.index.privacy-notice-statement-what-happens-if-you-dont-give-us-your-information-text')}</p>
      </CollapsibleDetails>
      <strong>
        <br /> <h3>{t('terms-and-conditions:terms-and-conditions.index.apply-now.title')}</h3>
      </strong>
      <br /> <p>{t('terms-and-conditions:terms-and-conditions.index.apply-now.text')}</p>
      <br />
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={`/apply`}>
          {t('terms-and-conditions:terms-and-conditions.index.apply-now.back-button')}
        </ButtonLink>
        <ButtonLink id="continue-button" to={`/apply/${id}/personal-info`}>
          {t('terms-and-conditions:terms-and-conditions.index.apply-now.start-button')}
        </ButtonLink>
      </div>
    </>
  );
}
