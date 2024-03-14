import { FormEvent, useRef } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Form, useLoaderData, useSubmit } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { CollapsibleDetails } from '~/components/collapsible';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getHCaptchaService } from '~/services/hcaptcha-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  const titleMetaTags = data ? getTitleMetaTags(data.meta.title) : [];
  return [...titleMetaTags, { name: 'robots', content: 'index' }];
});

export async function loader({ request }: LoaderFunctionArgs) {
  const { HCAPTCHA_SITE_KEY } = getEnv();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:index.page-title') }) };

  return { meta, siteKey: HCAPTCHA_SITE_KEY };
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    'h-captcha-response': z.string().min(1, { message: 'Please indicate that you are human.' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const hCaptchaService = getHCaptchaService();
  const hCaptchaResponse = parsedDataResult.data['h-captcha-response'];
  const hCaptchaResult = await hCaptchaService.verifyHCaptchaResponse(hCaptchaResponse);

  // TODO handle the hCaptchaResult (eg. log the result or redirect to another page)
  console.log(hCaptchaResult);

  const applyFlow = getApplyFlow();
  const id = randomUUID().toString();
  const sessionResponseInit = await applyFlow.start({ id, request });
  return redirectWithLocale(request, `/apply/${id}/terms-and-conditions`, sessionResponseInit);
}

export default function ApplyIndex() {
  const { siteKey } = useLoaderData<typeof loader>();
  const captchaRef = useRef<HCaptcha>(null);
  const submit = useSubmit();
  const { t } = useTranslation(handle.i18nNamespaces);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captchaRef.current) {
      const formData = new FormData(event.currentTarget);
      const { response } = await captchaRef.current.execute({ async: true });
      formData.set('h-captcha-response', response);
      submit(formData, { method: 'POST' });

      captchaRef.current.resetCaptcha();
    }

    sessionStorage.setItem('flow.state', 'active');
  }

  const contactCDCPLink = <InlineLink to={t('apply:index.links.contact-cdcp')} />;
  const filedTaxReturnLink = <InlineLink to={t('apply:index.links.filed-tax-return')} />;
  const serviceCanadaOfficeLink = <InlineLink to={t('apply:index.links.service-canada-office')} />;
  const whenApplyCDCPLink = <InlineLink to={t('apply:index.links.when-apply-cdcp')} />;

  return (
    <div className="max-w-prose">
      <div className="space-y-4">
        <p>{t('apply:index.intro-text')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.application-phases" components={{ whenApplyCDCPLink }} />
        </p>
        <p>{t('apply:index.to-qualify.heading')}</p>
        <ul className="list-disc space-y-1 pl-7">
          <li>
            <p>{t('apply:index.to-qualify.conditions.insurance-access.heading')}</p>
            <CollapsibleDetails summary={t('apply:index.to-qualify.conditions.insurance-access.details.summary')}>
              <div className="space-y-4">
                <p>{t('apply:index.to-qualify.conditions.insurance-access.details.access-to-dental-insurance-definition')}</p>
                <ul className="list-disc space-y-1 pl-7">
                  <li>{t('apply:index.to-qualify.conditions.insurance-access.details.access-methods.through-employer-benefits')}</li>
                  <li>{t('apply:index.to-qualify.conditions.insurance-access.details.access-methods.through-pension-benefits')}</li>
                  <li>{t('apply:index.to-qualify.conditions.insurance-access.details.access-methods.through-professional-or-student-organization')}</li>
                  <li>{t('apply:index.to-qualify.conditions.insurance-access.details.access-methods.purchased-insurance')}</li>
                </ul>
                <p>{t('apply:index.to-qualify.conditions.insurance-access.details.opt-out-consideration')}</p>
              </div>
            </CollapsibleDetails>
          </li>
          <li>
            <p>{t('apply:index.to-qualify.conditions.income.heading')}</p>
            <CollapsibleDetails summary={t('apply:index.to-qualify.conditions.income.details.summary')}>
              <div className="space-y-4">
                <p>{t('apply:index.to-qualify.conditions.income.details.family-net-income-definition')}</p>
                <p>
                  <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.to-qualify.conditions.income.details.uccb-and-rdsp-income-received" />
                </p>
                <p>
                  <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.to-qualify.conditions.income.details.uccb-and-rdsp-amounts-repaid" />
                </p>
                <hr className="my-8 h-px border-0 bg-black" />
                <p>
                  <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.to-qualify.conditions.income.details.adjusted-family-net-income" />
                </p>
              </div>
            </CollapsibleDetails>
          </li>
          <li>{t('apply:index.to-qualify.conditions.resident-status')}</li>
          <li>
            <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.to-qualify.conditions.tax-return" components={{ filedTaxReturnLink }} />
          </li>
        </ul>
      </div>
      <h2 className="my-8 font-lato text-2xl font-bold">{t('apply:index.what-you-need.heading')}</h2>
      <div className="space-y-4">
        <p>{t('apply:index.what-you-need.preparation-instructions')}</p>
        <ul className="list-disc space-y-1 pl-7">
          <li>{t('apply:index.what-you-need.requirements.social-insurance-number')}</li>
          <li>{t('apply:index.what-you-need.requirements.date-of-birth')}</li>
          <li>{t('apply:index.what-you-need.requirements.full-name')}</li>
          <li>{t('apply:index.what-you-need.requirements.home-and-mailing-address')}</li>
          <li>{t('apply:index.what-you-need.requirements.dental-coverage')}</li>
        </ul>
      </div>
      <h2 className="my-8 font-lato text-2xl font-bold">{t('apply:index.apply-behalf.heading')}</h2>
      <div className="space-y-4">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.apply-behalf.delegate-assisted-cdcp-application" components={{ contactCDCPLink, serviceCanadaOfficeLink }} />
        </p>
        <CollapsibleDetails summary={t('apply:index.apply-behalf.trusted-person.summary')}>
          <div className="space-y-4">
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.apply-behalf.trusted-person.details.application-assistance" components={{ serviceCanadaOfficeLink }} />
            </p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:index.apply-behalf.trusted-person.details.types-of-assistants.friend')}</li>
              <li>{t('apply:index.apply-behalf.trusted-person.details.types-of-assistants.relative')}</li>
              <li>{t('apply:index.apply-behalf.trusted-person.details.types-of-assistants.caregiver')}</li>
              <li>{t('apply:index.apply-behalf.trusted-person.details.types-of-assistants.translator')}</li>
              <li>{t('apply:index.apply-behalf.trusted-person.details.types-of-assistants.interpreter')}</li>
            </ul>
          </div>
        </CollapsibleDetails>
        <CollapsibleDetails summary={t('apply:index.apply-behalf.delegate.summary')}>
          <div className="space-y-4">
            <p>{t('apply:index.apply-behalf.delegate.delegate-definition')}</p>
            <p>{t('apply:index.apply-behalf.delegate.delegates-on-document')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:index.apply-behalf.delegate.valid-delegates.powers-of-attorney-mandates')}</li>
              <li>{t('apply:index.apply-behalf.delegate.valid-delegates.trusteeships')}</li>
            </ul>
            <p>{t('apply:index.apply-behalf.delegate.delegate-requirements')}</p>
            <p>{t('apply:index.apply-behalf.delegate.document-processing')}</p>
            <h3 className="font-lato text-xl font-bold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.heading')}</h3>
            <h4 className="font-lato font-bold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.heading')}</h4>
            <p>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.document-submission-by-mail')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.cover-letter-details.applicant-full-name')}</li>
              <li>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.cover-letter-details.applicant-sin')}</li>
              <li>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.cover-letter-details.submission-statement')}</li>
              <li>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.cover-letter-details.delegate-phone')}</li>
              <li>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.cover-letter-details.return-address')}</li>
            </ul>
            <table className="w-full">
              <caption className="pb-6 pt-2 text-left font-lato text-xl font-semibold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.caption')}</caption>
              <thead>
                <tr>
                  <th className="p-2 text-left">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.headers.province-region')}</th>
                  <th className="p-2 text-left">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.headers.mailing-address')}</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-t">
                <tr className="bg-gray-50">
                  <td className="p-2 font-bold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.atlantic-canada.name')}</td>
                  <td className="p-2">
                    <address className="whitespace-pre-wrap not-italic">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.atlantic-canada.address')}</address>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.quebec.name')}</td>
                  <td className="p-2">
                    <address className="whitespace-pre-wrap not-italic">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.quebec.address')}</address>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-2 font-bold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.ontario.name')}</td>
                  <td className="p-2">
                    <address className="whitespace-pre-wrap not-italic">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.ontario.address')}</address>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.western-canada-and-territories.name')}</td>
                  <td className="p-2">
                    <address className="whitespace-pre-wrap not-italic">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.by-mail.mailing-addresses.western-canada-and-territories.address')}</address>
                  </td>
                </tr>
              </tbody>
            </table>
            <h4 className="font-lato font-bold">{t('apply:index.apply-behalf.delegate.submit-delegate-proof.in-person.heading')}</h4>
            <p>
              <Trans ns={handle.i18nNamespaces} i18nKey="apply:index.apply-behalf.delegate.submit-delegate-proof.in-person.document-submission-at-service-canada" components={{ serviceCanadaOfficeLink }} />
            </p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.in-person.submission-requirements.applicant-full-name')}</li>
              <li>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.in-person.submission-requirements.applicant-sin')}</li>
            </ul>
            <p>{t('apply:index.apply-behalf.delegate.submit-delegate-proof.in-person.document-processing-note')}</p>
          </div>
        </CollapsibleDetails>
      </div>
      <Form method="post" onSubmit={handleSubmit} noValidate className="mt-8">
        <HCaptcha size="invisible" sitekey={siteKey} ref={captchaRef} />
        <Button variant="primary" id="continue-button">
          {t('apply:index.submit')}
          <FontAwesomeIcon icon={faChevronRight} className="ms-3 block size-4" />
        </Button>
      </Form>
    </div>
  );
}
