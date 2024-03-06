import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '~/components/buttons';
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

  const body = new URLSearchParams(await request.text());
  const buttonPressed = body.get('button');
  console.debug('BUTTON PRESSED ::: ' + JSON.stringify(buttonPressed, null, 2));
  if (buttonPressed === 'answerQuestions') {
    const sessionResponseInit = await applyFlow.saveState({
      request,
      params,
      state,
    });
    return redirect(`/apply/${id}/demographics-part1`, sessionResponseInit);
  }
  if (buttonPressed === 'continueToReview') {
    const sessionResponseInit = await applyFlow.saveState({
      request,
      params,
      state,
    });
    return redirect(`/apply/${id}/review-information`, sessionResponseInit);
  }

  throw new Response('Not Found', { status: 404 });
}

export default function Demographics() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <Form method="post" className="space-y-6">
        <Trans ns={i18nNamespaces} i18nKey="demographics-oral-health-questions:optional-demographic-oral-health-questions.paragraph1" />
        <p className="mb-6">{t('demographics-oral-health-questions:optional-demographic-oral-health-questions.paragraph2')}</p>

        <div>
          <Button id="answer-button" variant="primary" name="button" value="answerQuestions">
            {t('demographics-oral-health-questions:optional-demographic-oral-health-questions.answer-button')}
            <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
          </Button>
        </div>
        <div>
          <Button id="continue-button" variant="alternative" name="button" value="continueToReview">
            {t('demographics-oral-health-questions:optional-demographic-oral-health-questions.skip-button')}
            <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
          </Button>
        </div>
      </Form>
    </>
  );
}
