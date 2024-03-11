import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-1110',
  pageTitleI18nKey: 'apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.page-title') }) }];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  return json({ id, state });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state,
  });

  return redirect(`/apply/${id}/demographics-part1`, sessionResponseInit);
}

export default function Demographics() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id } = useLoaderData<typeof loader>();

  return (
    <Form method="post" className="space-y-6">
      <p className="mb-6">{t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.responses-will-be-confidential')}</p>
      <p className="mb-6">{t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.questions-are-voluntary')}</p>
      <p className="mb-6">{t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.anwsers-will-not-affect-eligibility')}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink id="back-button" variant="alternative" to={`/apply/${id}/federal-provincial-territorial-benefits`}>
          {t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.back-button')}
          <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
        </ButtonLink>
        <Button id="answer-button" variant="primary">
          {t('apply:demographics-oral-health-questions.optional-demographic-oral-health-questions.answer-button')}
          <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
        </Button>
      </div>
    </Form>
  );
}
