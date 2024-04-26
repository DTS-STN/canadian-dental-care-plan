import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyRouteHelpers } from '~/route-helpers/apply-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum ApplicantType {
  Delegate = 'delegate',
  Personal = 'personal',
  Child = 'child',
  Both = 'personal and child',
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

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const applyRouteHelpers = getApplyRouteHelpers();
  const state = await applyRouteHelpers.loadState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.type-of-application.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.typeOfApplication });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/type-of-application');

  const applyRouteHelpers = getApplyRouteHelpers();
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfApplicationSchema: z.ZodType<TypeOfApplicationState> = z.nativeEnum(ApplicantType, {
    errorMap: () => ({ message: t('apply:eligibility.type-of-application.error-message.type-of-application-required') }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = String(formData.get('typeOfApplication') ?? '');
  const parsedDataResult = typeOfApplicationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format()._errors });
  }

  await applyRouteHelpers.saveState({ params, request, session, state: { typeOfApplication: parsedDataResult.data } });

  if (parsedDataResult.data === ApplicantType.Delegate) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/application-delegate', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/tax-filing', params));
}

export default function ApplyFlowTypeOfApplication() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-type-of-application-option-0': fetcher.data?.errors[0],
    }),
    [fetcher.data?.errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        const fieldIds = createErrorSummaryItems(errorMessages).map(({ fieldId }) => fieldId);
        adobeAnalytics.pushValidationErrorEvent(fieldIds);
      }
    }
  }, [errorMessages]);

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
        <p className="mb-6">{t('apply:eligibility.type-of-application.page-description')}</p>
        <div className="mb-6 space-y-4">
          <h2 className="font-bold">{t('apply:eligibility.type-of-application.apply-self')}</h2>
          <p>{t('apply:eligibility.type-of-application.apply-self-eligibility')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('apply:eligibility.type-of-application.senior')}</li>
            <li>{t('apply:eligibility.type-of-application.valid-disability-tax-credit')}</li>
            <li>{t('apply:eligibility.type-of-application.live-independently')}</li>
          </ul>
          <h2 className="font-bold">{t('apply:eligibility.type-of-application.apply-child')}</h2>
          <p>{t('apply:eligibility.type-of-application.apply-child-eligibility')}</p>
          <ul className="list-disc space-y-1 pl-7">
            <li>{t('apply:eligibility.type-of-application.sixteen-or-older')}</li>
            <li>{t('apply:eligibility.type-of-application.under-eighteen')}</li>
          </ul>
          <p>{t('apply:eligibility.type-of-application.note')}</p>
        </div>
        <Collapsible summary={t('apply:eligibility.type-of-application.split-custody-summary')}>
          <p>{t('apply:eligibility.type-of-application.split-custody-detail')}</p>
        </Collapsible>
        <p className="mb-4 mt-8 italic" id="form-instructions">
          {t('apply:required-label')}
        </p>
        <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="type-of-application"
            name="typeOfApplication"
            legend={t('apply:eligibility.type-of-application.form-instructions')}
            options={[
              {
                value: ApplicantType.Personal,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.type-of-application.radio-options.personal" />,
                defaultChecked: defaultState === ApplicantType.Personal,
              },
              {
                value: ApplicantType.Child,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.type-of-application.radio-options.child" />,
                defaultChecked: defaultState === ApplicantType.Child,
              },
              {
                value: ApplicantType.Both,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.type-of-application.radio-options.personal-and-child" />,
                defaultChecked: defaultState === ApplicantType.Both,
              },
              {
                value: ApplicantType.Delegate,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:eligibility.type-of-application.radio-options.delegate" />,
                defaultChecked: defaultState === ApplicantType.Delegate,
              },
            ]}
            required
            errorMessage={errorMessages['input-radio-type-of-application-option-0']}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Type of application click">
              {t('apply:eligibility.type-of-application.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
            <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/terms-and-conditions" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Type of application click">
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply:eligibility.type-of-application.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
