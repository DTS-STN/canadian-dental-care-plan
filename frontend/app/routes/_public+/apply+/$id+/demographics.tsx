import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
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
  const redirectUrl = parsedDataResult.data.button === 'answerQuestions' ? `/apply/${id}/demographics-part1` : `/apply/${id}/terms-and-conditions`;
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
        <p className="mb-6">{t('optional-demographic-oral-health-questions.responses-will-be-confidential')}</p>
        <p className="mb-6">{t('optional-demographic-oral-health-questions.questions-are-voluntary')}</p>
        <p className="mb-6">{t('optional-demographic-oral-health-questions.anwsers-will-not-affect-eligibility')}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button id="continue-button" variant="alternative" name="button" value="continueToReview">
            {t('optional-demographic-oral-health-questions.back-button')}
            <FontAwesomeIcon icon={faChevronLeft} className="pl-2" />
          </Button>
          <Button id="answer-button" variant="primary" name="button" value="answerQuestions">
            {t('optional-demographic-oral-health-questions.answer-button')}
            <FontAwesomeIcon icon={faChevronRight} className="pl-2" />
          </Button>
        </div>
      </Form>
    </>
  );
}
