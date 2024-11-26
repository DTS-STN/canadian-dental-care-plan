import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { TYPES } from '~/.server/constants';
import { loadDemographicSurveyState } from '~/.server/routes/helpers/demographic-survey-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { InlineLink } from '~/components/inline-link';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

enum FormAction {
  Continue = 'continue',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('demographic-survey', 'gcweb'),
  pageIdentifier: pageIds.public.demographicSurvey.summary,
  pageTitleI18nKey: 'demographic-survey:summary.page-heading',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, request, params }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('demographic-survey:summary.page-title') }) };

  const state = loadDemographicSurveyState({ params, session });

  return { meta, members: state.memberInformation };
}

export async function action({ context: { appContainer, session }, request, params }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  return redirect(getPathById('public/demographic-survey/$id/submitted', params));
}

export default function DemographicSurveySummary() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { members } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const params = useParams();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <div className="max-w-prose">
      <div className="mb-6 space-y-6">
        <p>{t('demographic-survey:summary.provide-a-response')}</p>
        <dl className="space-y-2">
          <dt>
            <strong>{t('demographic-survey:summary.please-select')}</strong>
          </dt>
          {members.map((member) => (
            <dd key={member.id} className="flex gap-4">
              <InlineLink routeId="public/demographic-survey/$id/questions/$memberId" params={{ ...params, memberId: member.id }}>
                {`${member.firstName} ${member.lastName}`}
              </InlineLink>
              {member.isSurveyCompleted && (
                <span className="text-zinc-800">
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-2 size-4 text-green-700" />
                  {t('demographic-survey:summary.completed')}
                </span>
              )}
              {!member.isSurveyCompleted && (
                <span className="text-zinc-800">
                  <FontAwesomeIcon icon={faCircleXmark} className="mr-2 size-4 text-red-700" />
                  {t('demographic-survey:summary.not-completed')}
                </span>
              )}
            </dd>
          ))}
        </dl>
        <p>{t('demographic-survey:summary.when-you-have-finished')}</p>
      </div>
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton id="continue-button" name="_action" value={FormAction.Continue} variant="green" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Demographic Survey:Continue - Summary click">
            {t('demographic-survey:summary.continue-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            routeId="public/demographic-survey/$id/terms-and-conditions"
            params={params}
            disabled={isSubmitting}
            startIcon={faChevronLeft}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form-Adult:Back - Marital status click"
          >
            {t('demographic-survey:summary.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
