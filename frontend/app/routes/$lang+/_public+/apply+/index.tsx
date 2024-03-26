import { FormEvent, useEffect, useRef } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../page-ids.json';
import { Button } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getHCaptchaService } from '~/services/hcaptcha-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.index,
  pageTitleI18nKey: 'apply:index.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request }: LoaderFunctionArgs) {
  const { HCAPTCHA_SITE_KEY } = getEnv();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:index.page-title') }) };

  return { meta, siteKey: HCAPTCHA_SITE_KEY };
}

export async function action({ request }: ActionFunctionArgs) {
  const log = getLogger('apply/index');

  const formData = await request.formData();
  const hCaptchaResponse = String(formData.get('h-captcha-response') ?? '');

  try {
    const hCaptchaService = getHCaptchaService();
    await hCaptchaService.verifyHCaptchaResponse(hCaptchaResponse);
  } catch (error) {
    log.warn(`hCaptcha verification failed: [${error}]; Proceeding with normal application flow`);
  }

  const applyFlow = getApplyFlow();
  const id = randomUUID().toString();
  const sessionResponseInit = await applyFlow.start({ id, request });

  return redirectWithLocale(request, `/apply/${id}/type-of-application`, sessionResponseInit);
}

export default function ApplyIndex() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { siteKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (captchaRef.current?.isReady()) {
      captchaRef.current.execute();
    } else {
      timeoutId = setTimeout(() => {
        captchaRef.current?.execute();
      }, 500);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (captchaRef.current) {
      try {
        const response = captchaRef.current.getResponse();
        formData.set('h-captcha-response', response);
      } catch (error) {
        /* intentionally ignore and proceed with submission */
      } finally {
        captchaRef.current.resetCaptcha();
      }

      fetcher.submit(formData, { method: 'POST' });
      sessionStorage.setItem('flow.state', 'active');
    }
  }

  const canadaTermsConditions = <InlineLink to={t('apply:index.links.canada-ca-terms-and-conditions')} />;
  const fileacomplaint = <InlineLink to={t('apply:index.links.file-complaint')} />;
  const hcaptchaTermsOfService = <InlineLink to={t('apply:index.links.hcaptcha')} />;
  const infosource = <InlineLink to={t('apply:index.links.info-source')} />;
  const microsoftDataPrivacyPolicy = <InlineLink to={t('apply:index.links.microsoft-data-privacy-policy')} />;

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p>{t('apply:index.intro-text')}</p>
        <Collapsible summary={t('apply:index.terms-and-conditions-of-use.summary')}>
          <div className="space-y-4">
            <h2 className="font-bold">{t('apply:index.terms-and-conditions-of-use.heading')}</h2>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.terms-and-conditions-of-use.online-application-legal-terms" components={{ canadaTermsConditions }} />
            </p>
            <p>{t('apply:index.terms-and-conditions-of-use.online-application-access-terms')}</p>
            <p>{t('apply:index.terms-and-conditions-of-use.online-application-usage-terms')}</p>
            <p>{t('apply:index.terms-and-conditions-of-use.terms-rejection-policy')}</p>
            <p>{t('apply:index.terms-and-conditions-of-use.esdc-definition-clarification')}</p>

            <h2 className="font-bold"> {t('apply:index.terms-and-conditions-of-use.online-application.heading')}</h2>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:index.terms-and-conditions-of-use.online-application.self-agreement')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.online-application.on-behalf-of-someone-else')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.online-application.at-your-own-risk')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.online-application.only-use')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.online-application.maintenance')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.online-application.inactive')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.online-application.msdc')}</li>
              <li>
                <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.terms-and-conditions-of-use.online-application.antibot" components={{ hcaptchaTermsOfService }} />
              </li>
            </ul>

            <h2 className="font-bold"> {t('apply:index.terms-and-conditions-of-use.disclaimers.heading')}</h2>
            <p>{t('apply:index.terms-and-conditions-of-use.disclaimers.online-application-disclaimer')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:index.terms-and-conditions-of-use.disclaimers.external-factors-disclaimer')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.disclaimers.online-application-information-non-acceptance')}</li>
              <li>{t('apply:index.terms-and-conditions-of-use.disclaimers.non-compliance')}</li>
            </ul>
            <p>{t('apply:index.terms-and-conditions-of-use.disclaimers.esdc-liability-indemnification')}</p>

            <h2 className="font-bold">{t('apply:index.terms-and-conditions-of-use.changes-to-these-terms-of-use.heading')}</h2>
            <p>{t('apply:index.terms-and-conditions-of-use.changes-to-these-terms-of-use.esdc-terms-amendment-policy')}</p>
          </div>
        </Collapsible>

        <Collapsible summary={t('apply:index.privacy-notice-statement.summary')}>
          <div className="space-y-4">
            <h2 className="font-bold"> {t('apply:index.privacy-notice-statement.personal-information.heading')}</h2>
            <p>{t('apply:index.privacy-notice-statement.personal-information.service-canada-application-administration')}</p>

            <h2 className="font-bold"> {t('apply:index.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.privacy-notice-statement.how-we-protect-your-privacy.personal-information-collection-and-use-authorization" />
            </p>
            <p>{t('apply:index.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:index.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.hc-ppu-440')}</li>
              <li>{t('apply:index.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.esdc-ppu-712')}</li>
            </ul>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.privacy-notice-statement.how-we-protect-your-privacy.info-source-access" components={{ infosource }} />
            </p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.privacy-notice-statement.how-we-protect-your-privacy.esdc-application-third-party-provider" components={{ microsoftDataPrivacyPolicy }} />
            </p>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.privacy-notice-statement.how-we-protect-your-privacy.personal-information-handling-complaint-process" components={{ fileacomplaint }} />
            </p>

            <h2 className="font-bold"> {t('apply:index.privacy-notice-statement.who-we-can-share-your-information-with.heading')}</h2>
            <p>{t('apply:index.privacy-notice-statement.who-we-can-share-your-information-with.esdc-personal-information-sharing')}</p>
            <p>{t('apply:index.privacy-notice-statement.who-we-can-share-your-information-with.benefits-administration-data-disclosure')}</p>
            <p>{t('apply:index.privacy-notice-statement.who-we-can-share-your-information-with.esdc-information-usage-policy')}</p>

            <h2 className="font-bold">{t('apply:index.privacy-notice-statement.what-happens-if-you-dont-give-us-your-information.heading')} </h2>
            <p>{t('apply:index.privacy-notice-statement.what-happens-if-you-dont-give-us-your-information.text')}</p>
          </div>
        </Collapsible>
      </div>
      <p className="my-8">{t('apply:index.apply.application-start-consent')}</p>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate>
        <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />
        <Button variant="primary" id="continue-button" disabled={isSubmitting}>
          {t('apply:index.apply.start-button')}
          <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
        </Button>
      </fetcher.Form>
    </div>
  );
}
