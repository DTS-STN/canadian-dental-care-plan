import { data, redirect, useFetcher } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/living-independently';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
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

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.livingIndependently,
  pageTitleI18nKey: 'application-spokes:living-independently.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:living-independently.page-title') }) };
  return { meta, defaultState: state.livingIndependently, editMode: state.editMode };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for living independently.
   */
  const livingIndependentlySchema = z.object({
    livingIndependently: z.enum(LIVING_INDEPENDENTLY_OPTION, {
      error: t('application-spokes:living-independently.error-message.living-independently-required'),
    }),
  });

  const parsedDataResult = livingIndependentlySchema.safeParse({
    livingIndependently: String(formData.get('livingIndependently') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  const isLivingindependently = parsedDataResult.data.livingIndependently === LIVING_INDEPENDENTLY_OPTION.yes;

  savePublicApplicationState({ params, session, state: { livingIndependently: isLivingindependently } });

  if (isLivingindependently) {
    return redirect(getPathById('public/application/$id/new-or-returning-member', params));
  }

  return redirect(getPathById('public/application/$id/parent-or-guardian', params));
}

export default function ApplyFlowLivingIndependently({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { livingIndependently: 'input-radio-living-independently-option-0' });

  return (
    <>
      <div className="max-w-prose">
        <p className="mb-6">{t('application-spokes:living-independently.description')}</p>
        <p className="mb-4 italic">{t('application:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="living-independently"
            name="livingIndependently"
            legend={t('application-spokes:living-independently.form-instructions')}
            options={[
              {
                value: LIVING_INDEPENDENTLY_OPTION.yes,
                children: t('application-spokes:living-independently.radio-options.yes'),
                defaultChecked: defaultState === true,
              },
              {
                value: LIVING_INDEPENDENTLY_OPTION.no,
                children: t('application-spokes:living-independently.radio-options.no'),
                defaultChecked: defaultState === false,
              },
            ]}
            required
            errorMessage={errors?.livingIndependently}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Continue - Living independently click">
              {t('application-spokes:living-independently.save-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              variant="secondary"
              routeId="public/application/$id/personal-information"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Living independently click"
            >
              {t('application-spokes:living-independently.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
