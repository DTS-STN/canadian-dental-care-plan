import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/living-independently';

import { TYPES } from '~/.server/constants';
import { loadApplyAdultState } from '~/.server/routes/helpers/apply-adult-route-helpers';
import { saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { Button, ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

const LIVING_INDEPENDENTLY_OPTION = {
  no: 'no',
  yes: 'yes',
} as const;

const FORM_ACTION = {
  cancel: 'cancel',
  save: 'save',
  continue: 'continue',
} as const;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.livingIndependently,
  pageTitleI18nKey: 'apply-adult:living-independently.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ data }) => (data ? getTitleMetaTags(data.meta.title) : []));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:living-independently.page-title') }) };
  return { meta, defaultState: state.livingIndependently, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const state = loadApplyAdultState({ params, request, session });
  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const formAction = z.nativeEnum(FORM_ACTION).parse(formData.get('_action'));

  if (formAction === FORM_ACTION.cancel) {
    return redirect(getPathById('public/apply/$id/adult/review-information', params));
  }

  /**
   * Schema for living independently.
   */
  const livingIndependentlySchema = z.object({
    livingIndependently: z.nativeEnum(LIVING_INDEPENDENTLY_OPTION, {
      errorMap: () => ({ message: t('apply-adult:living-independently.error-message.living-independently-required') }),
    }),
  });

  const parsedDataResult = livingIndependentlySchema.safeParse({
    livingIndependently: String(formData.get('livingIndependently') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  const isLivingindependently = parsedDataResult.data.livingIndependently === LIVING_INDEPENDENTLY_OPTION.yes;

  if (state.editMode) {
    // Temporary state save until the user is finished with editMode workflow.
    saveApplyState({ params, session, state: { editModeLivingIndependently: isLivingindependently } });
  } else {
    saveApplyState({ params, session, state: { livingIndependently: isLivingindependently } });
  }

  if (isLivingindependently) {
    return redirect(getPathById('public/apply/$id/adult/new-or-existing-member', params));
  }

  return redirect(getPathById('public/apply/$id/adult/parent-or-guardian', params));
}

export default function ApplyFlowLivingIndependently({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, editMode } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { livingIndependently: 'input-radio-living-independently-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={33} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-6">{t('apply-adult:living-independently.description')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="living-independently"
            name="livingIndependently"
            legend={t('apply-adult:living-independently.form-instructions')}
            options={[
              {
                value: LIVING_INDEPENDENTLY_OPTION.yes,
                children: t('apply-adult:living-independently.radio-options.yes'),
                defaultChecked: defaultState === true,
              },
              {
                value: LIVING_INDEPENDENTLY_OPTION.no,
                children: t('apply-adult:living-independently.radio-options.no'),
                defaultChecked: defaultState === false,
              },
            ]}
            required
            errorMessage={errors?.livingIndependently}
          />
          {editMode ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button id="save-button" name="_action" value={FORM_ACTION.save} variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Living independently click">
                {t('apply-adult:living-independently.save-btn')}
              </Button>
              <Button id="cancel-button" name="_action" value={FORM_ACTION.cancel} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Cancel - Living independently click">
                {t('apply-adult:living-independently.cancel-btn')}
              </Button>
            </div>
          ) : (
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                variant="primary"
                id="continue-button"
                name="_action"
                value={FORM_ACTION.continue}
                loading={isSubmitting}
                endIcon={faChevronRight}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Living independently click"
              >
                {t('apply-adult:living-independently.continue-btn')}
              </LoadingButton>
              <ButtonLink
                id="back-button"
                routeId="public/apply/$id/adult/applicant-information"
                params={params}
                disabled={isSubmitting}
                startIcon={faChevronLeft}
                data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Living independently click"
              >
                {t('apply-adult:living-independently.back-btn')}
              </ButtonLink>
            </div>
          )}
        </fetcher.Form>
      </div>
    </>
  );
}
