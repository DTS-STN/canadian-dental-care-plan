import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import { getFixedT } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { Collapsible } from '~/components/collapsible';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('demographic-survey', 'gcweb'),
  pageIdentifier: pageIds.public.demographicSurvey.termsAndConditions,
  pageTitleI18nKey: 'demographic-survey:terms-and-conditions.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request, params }: LoaderFunctionArgs) {
  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('demographic-survey:terms-and-conditions.page-title') }) };

  return { csrfToken, meta };
}

export async function action({ context: { appContainer, session }, request, params }: ActionFunctionArgs) {
  const log = getLogger('demographic-survey/terms-and-conditions');

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  return redirect(getPathById('public/demographic-survey/$id/summary', params));
}

export default function DemographicSurveyTermsAndConditions() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="space-y-6">
        <p>{t('demographic-survey:terms-and-conditions.intro-text')}</p>
        <p>{t('demographic-survey:terms-and-conditions.answering-questions')}</p>
        <p>{t('demographic-survey:terms-and-conditions.completion-of-survey')}</p>
        <p>{t('demographic-survey:terms-and-conditions.feedback-time')}</p>
        <Collapsible summary={t('demographic-survey:terms-and-conditions.privacy-notice-statement.summary')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <p>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.your-privacy')}</p>
              <p>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.privacy-act')}</p>
              <p>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.information-you-provide')}</p>
              <p>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.third-party')}</p>
            </section>
            <section className="space-y-4">
              <h2 className="font-lato text-lg font-bold"> {t('demographic-survey:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.heading')}</h2>
              <p>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-rights-and-access')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.hc-ppu-440')}</li>
                <li>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.how-we-protect-your-privacy.personal-information-banks.esdc-ppu-712')}</li>
              </ul>
            </section>
            <section className="space-y-4">
              <p>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.info-source-access')}</p>
              <p>{t('demographic-survey:terms-and-conditions.privacy-notice-statement.personal-information-handling-complaint-process')}</p>
            </section>
          </div>
        </Collapsible>
      </div>
      <p className="my-8">{t('demographic-survey:terms-and-conditions.take-survey.application-participation')}</p>
      <fetcher.Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <LoadingButton
          aria-describedby="application-consent"
          variant="primary"
          id="continue-button"
          loading={isSubmitting}
          endIcon={faChevronRight}
          data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic survey:Agree and Continue - Terms and Conditions click"
        >
          {t('demographic-survey:terms-and-conditions.take-survey.start-button')}
        </LoadingButton>
      </fetcher.Form>
    </div>
  );
}
