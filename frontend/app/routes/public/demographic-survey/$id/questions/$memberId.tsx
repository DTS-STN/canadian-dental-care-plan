import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../../page-ids.json';
import { AppPageTitle } from '~/components/layouts/public-layout';
import { loadDemographicSurveyState } from '~/route-helpers/demographic-survey-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('demographic-survey', 'gcweb'),
  pageIdentifier: pageIds.public.demographicSurvey.questions,
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, request, params }: LoaderFunctionArgs) {
  const csrfToken = String(session.get('csrfToken'));

  const state = loadDemographicSurveyState({ params, session });
  const member = state.memberInformation.find((member) => member.id === params.memberId);
  const memberName = `${member?.firstName} ${member?.lastName}`;

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('demographic-survey:questions.page-title', { memberName }) }) };

  return json({ csrfToken, meta, memberName });
}

export default function DemographicSurveyQuestions() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { memberName } = useLoaderData<typeof loader>();
  return (
    <>
      <AppPageTitle>{t('demographic-survey:questions.page-title', { memberName })}</AppPageTitle>
      <div className="max-w-prose"></div>
    </>
  );
}
