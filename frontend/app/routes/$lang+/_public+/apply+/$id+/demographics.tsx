import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData, useNavigation } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.demographics,
  pageTitleI18nKey: 'apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.page-title') }) };

  return json({ id, meta, state });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state,
  });

  return redirectWithLocale(request, `/apply/${id}/demographics-part1`, sessionResponseInit);
}

export default function Demographics() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <Form method="post" className="space-y-6">
      <p className="mb-6">{t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.responses-will-be-confidential')}</p>
      <p className="mb-6">{t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.questions-are-voluntary')}</p>
      <p className="mb-6">{t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.anwsers-will-not-affect-eligibility')}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" to={`/apply/${id}/federal-provincial-territorial-benefits`} disabled={navigation.state !== 'idle'}>
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.back-button')}
        </ButtonLink>
        <Button variant="primary" id="continue-button" disabled={navigation.state !== 'idle'}>
          {t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.answer-button')}
          <FontAwesomeIcon icon={navigation.state !== 'idle' ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', navigation.state !== 'idle' && 'animate-spin')} />
        </Button>
      </div>
    </Form>
  );
}
