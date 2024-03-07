import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

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

  const formDataSchema = z.object({
    button: z.enum(['answerQuestions', 'continueToReview']),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = await formDataSchema.safeParseAsync(formData);
  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }
  const redirectUrl = parsedDataResult.data.button === 'answerQuestions' ? `/apply/${id}/demographics-part1` : `/apply/${id}/review-information`;
  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state,
  });
  return redirect(redirectUrl, sessionResponseInit);
}

export default function Demographics() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <Form method="post" className="space-y-6">
        <Trans ns={i18nNamespaces} i18nKey="demographics-oral-health-questions:optional-demographic-oral-health-questions.questions-are-voluntary" />
        <p className="mb-6">{t('demographics-oral-health-questions:optional-demographic-oral-health-questions.answers-will-be-used')}</p>

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
