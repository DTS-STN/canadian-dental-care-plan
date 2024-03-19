import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum ApplicantType {
  Delegate = 'delegate',
  Personal = 'personal',
}

export type TypeOfApplicationState = `${ApplicantType}`;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.typeOfApplication,
  pageTitleI18nKey: 'apply:eligibility.type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.type-of-application.page-title') }) };

  return json({ id, meta, state: state.typeOfApplication });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfApplicationSchema: z.ZodType<TypeOfApplicationState> = z.nativeEnum(ApplicantType, {
    errorMap: () => ({ message: t('apply:eligibility.type-of-application.error-message.type-of-application-required') }),
  });

  const formData = await request.formData();
  const data = String(formData.get('typeOfApplication') ?? '');

  const parsedDataResult = typeOfApplicationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: data,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { typeOfApplication: parsedDataResult.data },
  });

  if (parsedDataResult.data === ApplicantType.Delegate) {
    return redirectWithLocale(request, `/apply/${id}/application-delegate`, sessionResponseInit);
  }

  return redirectWithLocale(request, `/apply/${id}/tax-filing`, sessionResponseInit);
}

export default function ApplyFlowTypeOfApplication() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id, state } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  const defaultValue = fetcher.data?.formData ?? state;

  useEffect(() => {
    if (fetcher.data && fetcher.data.errors._errors.length > 0) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  // Keys order should match the input IDs order.
  const errorMessages = {
    'input-radio-type-of-application-option-0': fetcher.data?.errors._errors[0],
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={10} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
          <InputRadios
            id="type-of-application"
            name="typeOfApplication"
            legend={t('apply:eligibility.type-of-application.form-instructions')}
            options={[
              {
                value: ApplicantType.Personal,
                children: t('apply:eligibility.type-of-application.radio-options.personal'),
                defaultChecked: defaultValue === ApplicantType.Personal,
              },
              {
                value: ApplicantType.Delegate,
                children: t('apply:eligibility.type-of-application.radio-options.delegate'),
                defaultChecked: defaultValue === ApplicantType.Delegate,
              },
            ]}
            required
            errorMessage={errorMessages['input-radio-type-of-application-option-0']}
          />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={`/apply/${id}/terms-and-conditions`} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply:eligibility.type-of-application.back-btn')}
            </ButtonLink>
            <Button variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('apply:eligibility.type-of-application.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
