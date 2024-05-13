import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { loadApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum LivingIndependentlyOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.livingIndependently,
  pageTitleI18nKey: 'apply-adult:living-independently.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:living-independently.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.livingIndependently, editMode: state.editMode });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult/living-independently');
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for living independently.
   */
  const livingIndependentlySchema = z.nativeEnum(LivingIndependentlyOption, {
    errorMap: () => ({ message: t('apply-adult:living-independently.error-message.living-independently-required') }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = String(formData.get('livingIndependently') ?? '');
  const parsedDataResult = livingIndependentlySchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format()._errors });
  }

  saveApplyState({ params, session, state: { livingIndependently: parsedDataResult.data === LivingIndependentlyOption.Yes } });

  if (state.editMode) {
    if (parsedDataResult.data === LivingIndependentlyOption.Yes) {
      return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/review-information', params));
    }
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/parent-or-guardian', params));
  }

  if (parsedDataResult.data === LivingIndependentlyOption.Yes) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/parent-or-guardian', params));
}

export default function ApplyFlowLivingIndependently() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, editMode } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-living-independently-option-0': fetcher.data?.errors[0],
    }),
    [fetcher.data?.errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        adobeAnalytics.pushValidationErrorEvent(errorSummaryItems.map(({ fieldId }) => fieldId));
      }
    }
  }, [errorMessages, errorSummaryItems]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={10} size="lg" />
      </div>
      <div className="max-w-prose">
        <p className="mb-6">{t('apply-adult:living-independently.description')}</p>
        <p className="mb-6 italic">{t('apply:required-label')}</p>
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="living-independently"
            name="livingIndependently"
            legend={t('apply-adult:living-independently.form-instructions')}
            options={[
              {
                value: LivingIndependentlyOption.Yes,
                children: t('apply-adult:living-independently.radio-options.yes'),
                defaultChecked: defaultState === true,
              },
              {
                value: LivingIndependentlyOption.No,
                children: t('apply-adult:living-independently.radio-options.no'),
                defaultChecked: defaultState === false,
              },
            ]}
            required
            errorMessage={errorMessages['input-radio-living-independently-option-0']}
          />
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Save - Living independently click">
                {t('apply-adult:living-independently.save-btn')}
              </Button>
              <ButtonLink
                id="back-button"
                routeId="$lang+/_public+/apply+/$id+/adult/review-information"
                params={params}
                disabled={isSubmitting}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Cancel - Adult flow living independently click"
              >
                {t('apply-adult:living-independently.back-btn')}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Living independently click">
                {t('apply-adult:living-independently.continue-btn')}
                <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
              </Button>
              <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/adult/date-of-birth" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Living independently click">
                <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
                {t('apply-adult:living-independently.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
