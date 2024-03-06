import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { Trans, useTranslation } from 'react-i18next';

import { Button, ButtonLink } from '~/components/buttons';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('demographics-oral-health-questions');
export const handle = {
  i18nNamespaces,
  pageIdentifier: 'CDCP-1110',
  pageTitleI18nKey: 'demographics-oral-health-questions:optional-demographic-oral-health-questions.page-title',
};
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
  const { t } = useTranslation(i18nNamespaces);
  const { id } = useLoaderData<typeof loader>();

  return (
    <>
      <Form method="post" className="space-y-6">
        <Trans ns={i18nNamespaces} i18nKey="demographics-oral-health-questions:optional-demographic-oral-health-questions.paragraph1" />
        <p className="mb-6">{t('demographics-oral-health-questions:optional-demographic-oral-health-questions.paragraph2')}</p>

        <div>
          <Button id="change-button" variant="primary">
            {t('demographics-oral-health-questions:optional-demographic-oral-health-questions.answer-button')}
          </Button>
        </div>
        <div>
          <ButtonLink id="cancel-button" to={`/apply/${id}/review-information`}>
            {t('demographics-oral-health-questions:optional-demographic-oral-health-questions.skip-button')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
