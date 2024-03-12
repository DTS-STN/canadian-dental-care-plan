import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { CollapsibleDetails } from '~/components/collapsible';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getLookupService } from '~/services/lookup-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: 'CDCP-1115',
  pageTitleI18nKey: 'apply:dental-insurance.title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });
  const options = await getLookupService().getAllAccessToDentalInsuranceOptions();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:dental-insurance.title') }) };

  return json({ id, meta, options, state });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = applyFlow.dentalInsuranceStateSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof applyFlow.dentalInsuranceStateSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { dentalInsurance: parsedDataResult.data },
  });

  return redirect(`/apply/${id}/federal-provincial-territorial-benefits`, sessionResponseInit);
}

export default function AccessToDentalInsuranceQuestion() {
  const { options, state, id } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation(handle.i18nNamespaces);
  const errorSummaryId = 'error-summary';

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`dental-insurance.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    dentalInsurance: getErrorMessage(actionData?.errors.dentalInsurance?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  const helpMessage = (
    <>
      <ul className="mb-4 list-disc">
        <li>{t('dental-insurance.list.employment')}</li>
        <li>{t('dental-insurance.list.pension')}</li>
        <li>{t('dental-insurance.list.purchased')}</li>
        <li>{t('dental-insurance.list.professional')}</li>
        <li className="list-none">
          <CollapsibleDetails id={t('dental-insurance.detail.additional-info.title')} summary={t('dental-insurance.detail.additional-info.title')}>
            <div>
              <p className="mt-4">{t('dental-insurance.detail.additional-info.not-eligible')}</p>
              <p className="mt-4">{t('dental-insurance.detail.additional-info.not-eligible-purchased')}</p>
              <p className="mt-4">{t('dental-insurance.detail.additional-info.eligible')}</p>
              <ul className="mb-4 list-disc pl-6">
                <li>{t('dental-insurance.detail.additional-info.list.opted')}</li>
                <li>{t('dental-insurance.detail.additional-info.list.cannot-opt')}</li>
              </ul>
            </div>
          </CollapsibleDetails>
        </li>
      </ul>
    </>
  );

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post">
        {options.length > 0 && (
          <div className="my-6">
            <InputRadios
              id="dental-insurance"
              name="dentalInsurance"
              legend={t('dental-insurance.legend')}
              options={options.map((option) => ({
                children: <Trans ns={handle.i18nNamespaces}>{`dental-insurance.option-${option.id}`}</Trans>,
                value: option.id,
                defaultChecked: state.dentalInsurance?.dentalInsurance === option.id,
              }))}
              helpMessagePrimary={helpMessage}
              helpMessagePrimaryClassName="pl-8 text-black"
              required={errorSummaryItems.length > 0}
              errorMessage={errorMessages.dentalInsurance}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink type="button" variant="alternative" to={`/apply/${id}/communication-preference`}>
            <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
            {t('dental-insurance.button.back')}
          </ButtonLink>
          <Button type="submit" variant="primary">
            {t('dental-insurance.button.continue')}
            <FontAwesomeIcon icon={faChevronRight} className="me-3 block size-4" />
          </Button>
        </div>
      </Form>
    </>
  );
}
