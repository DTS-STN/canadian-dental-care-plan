import { FormEvent, useRef } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { Form, useLoaderData, useSubmit } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { randomUUID } from 'crypto';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { CollapsibleDetails } from '~/components/collapsible';
import { InlineLink } from '~/components/inline-link';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getHCaptchaService } from '~/services/hcaptcha-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
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

  const hCaptchaService = await getHCaptchaService();
  const hCaptchaResponse = parsedDataResult.data['h-captcha-response'];
  const hCaptchaResult = await hCaptchaService.verifyHCaptchaResponse(hCaptchaResponse);

  // TODO handle the hCaptchaResult (eg. log the result or redirect to another page)
  console.log(hCaptchaResult);

  const applyFlow = getApplyFlow();
  const id = randomUUID().toString();
  const sessionResponseInit = await applyFlow.start({ id, request });
  return redirect(`/apply/${id}/terms-and-conditions`, sessionResponseInit);
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

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-4">The Canadian Dental Care Plan (CDCP) will help ease financial barriers to accessing oral health care for eligible Canadian residents.</p>
        <p className="mb-4">
          Applications for the CDCP is opening in phases. <InlineLink to="https://www.canada.ca/en/services/benefits/dental/dental-care-plan/apply.html#when">Find out when you can apply for the CDCP.</InlineLink>
        </p>
        <p className="mb-4">To qualify for the CDCP, you must:</p>
        <ul className="mb-4 list-disc space-y-1 pl-7">
          <li>
            <p>not have access to private dental coverage</p>
            <CollapsibleDetails summary="What counts as access to dental insurance?">
              <div className="space-y-4">
                <p>&#34;Access to dental insurance&#34; means access to any type of dental insurance or coverage through other channels, such as:</p>
                <ul className="mb-4 list-disc space-y-1 pl-7">
                  <li>through your employer or a family member&#39;s employer benefits, including health and wellness accounts</li>
                  <li>through your pension (previous employer) or a family member&#39;s pension benefits</li>
                  <li>through a professional or student organization</li>
                  <li>purchased by you or a family member or through a group plan from an insurance or benefits company</li>
                </ul>
                <p>You&#39;re still considered to have access to dental insurance if you choose to opt out of available benefits like these.</p>
              </div>
            </CollapsibleDetails>
          </li>
          <li>
            <p>have an adjusted family net income of less than $90,000</p>
            <CollapsibleDetails summary="What is adjusted new family income?">
              <div className="space-y-4">
                <p>Your family net income (line 23600 of your tax return plus line 23600 of your spouse&#39;s or common-law partner&#39;s tax return, and any world income not reported in a tax return to the CRA, such as by a new resident)</p>
                <p>
                  <strong>&#8722; any universal child care benefit(UCCB) and registered disability savings plan (RDSP) income received</strong> (line11700 and line 12500 of your or your spouse&#39;s or common-law partner&#39;s tax return)
                </p>
                <p>
                  <strong>&#43; any UCCB and RDSP amounts repaid</strong> (line 21300 and line 23200 of your or your spouse&#39;s or common-law partner&#39;s tax return)
                </p>
                <hr className="my-8 h-px border-0 bg-black" />
                <p>
                  <strong>&#61; adjusted family net income</strong>
                </p>
              </div>
            </CollapsibleDetails>
          </li>
          <li>be a Canadian resident for tax purposes</li>
          <li>
            have <InlineLink to="https://www.canada.ca/en/services/taxes/income-tax/personal-income-tax/get-ready-taxes.html">filed your tax return</InlineLink> for the previous year and received your Notice of Assessment
          </li>
        </ul>
        <h2 className="my-8 font-lato text-2xl font-bold">What you need before you start:</h2>
        <p className="mb-4">
          Save time when filling out your application by gathering all the necessary information before you begin. To complete your application, you will need to provide the following information for yourself, and your spouse/common-law partner and
          dependents (if applicable):
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-7">
          <li>Social Insurance Number</li>
          <li>Date of birth</li>
          <li>Full name</li>
          <li>Home and mailing address</li>
          <li>List of the dental coverage you have through government social programs (if applicable)</li>
        </ul>
        <h2 className="my-8 font-lato text-2xl font-bold">Applying on behalf of someone else</h2>
        <p className="mb-4">
          You can apply for the CDCP with the help of a trusted person or a delegate. Both must be done through a Service Canada representative in person at a{' '}
          <InlineLink to="https://www.servicecanada.gc.ca/tbsc-fsco/sc-hme.jsp?lang=eng">Service Canada office</InlineLink> or by <InlineLink to="https://www.canada.ca/en/services/benefits/dental/dental-care-plan/contact.html">phone</InlineLink>.
        </p>
        <CollapsibleDetails summary="Applying with the help of a trusted person">
          <div className="space-y-4">
            <p>
              You can ask a trusted person to help you apply by phone or visiting us at a <InlineLink to="https://www.servicecanada.gc.ca/tbsc-fsco/sc-hme.jsp">Service Canada office</InlineLink>. You must give clear consent that you agree to let them help
              you. This could be a:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-7">
              <li>friend</li>
              <li>relative</li>
              <li>caregiver</li>
              <li>translator, or</li>
              <li>interpreter</li>
            </ul>
          </div>
        </CollapsibleDetails>
        <CollapsibleDetails summary="Applying through a delegate">
          <div className="space-y-4">
            <p>Delegates are individuals who have the legal authority to represent you and make decisions on your behalf.</p>
            <p>They can represent you if they&#39;re listed as your delegate on documents such as:</p>
            <ul className="mb-4 list-disc space-y-1 pl-7">
              <li>powers of attorney/mandates, or</li>
              <li>trusteeships</li>
            </ul>
            <p>
              Before you apply for the CDCP, delegates must provide the powers of attorney, mandates or trusteeship documents that prove they have legal authority to represent you. Original documents or certified copies can be sent by mail or submitted in
              person at any Service Canada office.
            </p>
            <p>
              Once the documents have been processed, a representative will contact the delegate to let them know we&#39;ve accepted and added the documents to your file. Once they receive this confirmation, the delegate can apply for the CDCP on your
              behalf.
            </p>
            <h3 className="font-lato text-xl font-bold">Submit your proof of delegate documents:</h3>
            <h4 className="font-lato font-bold">By mail</h4>
            <p>If you or the delegate are sending the documents by mail, please include a cover letter that details:</p>
            <ul className="mb-4 list-disc space-y-1 pl-7">
              <li>the applicant&#39;s full name</li>
              <li>the applicant&#39;s Social Insurance Number (SIN)</li>
              <li>a statement that the documents are being submitted for the CDCP</li>
              <li>the delegate&#39;s phone number and</li>
              <li>a return address for us to send the original documents or certified copies back to once we&#39;ve processed them</li>
            </ul>
            <table className="w-full">
              <caption className="pb-6 pt-2 text-left font-lato text-xl font-semibold">Mailing addresses by region</caption>
              <thead>
                <tr>
                  <th className="p-2 text-left">Province/Region</th>
                  <th className="p-2 text-left">Mailing address</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-t">
                <tr className="bg-gray-50">
                  <td className="p-2 font-bold">Atlantic Canada</td>
                  <td className="p-2">
                    <address className="not-italic">
                      Service Canada
                      <br />
                      Canadian Dental Care Plan
                      <br />
                      PO Box 250 Station A<br />
                      Fredericton, NB E3B 4Z6
                    </address>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">Quebec</td>
                  <td className="p-2">
                    <address className="not-italic">
                      Service Canada
                      <br />
                      Canadian Dental Care Plan
                      <br />
                      PO Box 60
                      <br />
                      Boucherville, QC J4B 5E6
                    </address>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-2 font-bold">Ontario</td>
                  <td className="p-2">
                    <address className="not-italic">
                      Service Canada
                      <br />
                      Canadian Dental Care Plan
                      <br />
                      PO Box 5100 Station D<br />
                      Scarborough, ON M1R 5C8
                    </address>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">Western Canada and Territories</td>
                  <td className="p-2">
                    <address className="not-italic">
                      Service Canada
                      <br />
                      Canadian Dental Care Plan
                      <br />
                      PO Box 2710 Station Main
                      <br />
                      Edmonton, AB T5J 2G4
                    </address>
                  </td>
                </tr>
              </tbody>
            </table>
            <h4 className="font-lato font-bold">In person</h4>
            <p>
              If you or the delegate provide the documents at a <InlineLink to="https://www.servicecanada.gc.ca/tbsc-fsco/sc-hme.jsp?lang=eng">Service Canada office</InlineLink>, please come prepared with:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-7">
              <li>the applicant&#39;s full name, and</li>
              <li>the applicant&#39;s Social Insurance Number (SIN)</li>
            </ul>
            <p>We will take a copy of your documents and send them to our processing team.</p>
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
    </>
  );
}
