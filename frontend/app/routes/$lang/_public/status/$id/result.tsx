import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { ClientFriendlyStatusMarkdown } from '~/components/client-friendly-status-markdown';
import { ContextualAlert } from '~/components/contextual-alert';
import { InlineLink } from '~/components/inline-link';
import { useFeature } from '~/root';
import { loadStatusState } from '~/route-helpers/status-route-helpers.server';
import { featureEnabled, getEnv } from '~/utils/env-utils.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('status', 'gcweb'),
  pageIdentifier: pageIds.public.status.myself,
  pageTitleI18nKey: 'status:myself.page-title',
} as const satisfies RouteHandleData;

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('status');
  const { ENABLED_FEATURES, HCAPTCHA_SITE_KEY } = getEnv();
  const { statusCheckResult } = loadStatusState({ params, session });

  const csrfToken = String(session.get('csrfToken'));
  const t = await getFixedT(request, handle.i18nNamespaces);

  const hCaptchaEnabled = ENABLED_FEATURES.includes('hcaptcha');

  const meta = { title: t('gcweb:meta.title.template', { title: t('status:myself.page-title') }) };

  return json({ statusResult: statusCheckResult, csrfToken, hCaptchaEnabled, meta, siteKey: HCAPTCHA_SITE_KEY });
}

export default function StatusCheckerResult() {
  const { statusResult } = useLoaderData<typeof loader>();
  const { t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  const statusCheckerRedirectFlag = useFeature('status-checker-redirects');

  return (
    <div className="max-w-prose">
      <ContextualAlert type={statusResult?.alertType ?? 'warning'}>
        <div>
          <h2 className="mb-2 font-bold" tabIndex={-1} id="status">
            {t('status:myself.status-heading')}
          </h2>
          {statusResult?.name && <ClientFriendlyStatusMarkdown content={statusResult.name} />}
        </div>
      </ContextualAlert>
      <div className="mt-12">
        <ButtonLink id="cancel-button" variant="primary" type="button" routeId="$lang/_public/status/index" params={params} endIcon={faChevronRight}>
          {t('status:myself.check-another')}
        </ButtonLink>
      </div>
      {statusCheckerRedirectFlag && (
        <div className="mt-6">
          <InlineLink to={t('status:myself.exit-link')} params={params} className="mt-6">
            {t('status:myself.exit-btn')}
          </InlineLink>
        </div>
      )}
    </div>
  );
}
