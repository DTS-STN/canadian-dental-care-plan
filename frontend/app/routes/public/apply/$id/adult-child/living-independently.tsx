import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../../page-ids.json';
import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { loadApplyAdultChildState } from '~/route-helpers/apply-adult-child-route-helpers.server';
import { saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum LivingIndependentlyOption {
  No = 'no',
  Yes = 'yes',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adultChild.livingIndependently,
  pageTitleI18nKey: 'apply-adult-child:living-independently.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { configProvider, serviceProvider, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultChildState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult-child:living-independently.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.livingIndependently });
}

export async function action({ context: { configProvider, serviceProvider, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/adult-child/living-independently');

  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for living independently.
   */
  const livingIndependentlySchema = z.object({
    livingIndependently: z.nativeEnum(LivingIndependentlyOption, {
      errorMap: () => ({ message: t('apply-adult-child:living-independently.error-message.living-independently-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { livingIndependently: String(formData.get('livingIndependently') ?? '') };
  const parsedDataResult = livingIndependentlySchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) });
  }

  saveApplyState({ params, session, state: { livingIndependently: parsedDataResult.data.livingIndependently === LivingIndependentlyOption.Yes } });

  return redirect(getPathById('public/apply/$id/adult-child/applicant-information', params));
}

export default function ApplyFlowLivingIndependently() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, {
    livingIndependently: 'input-radio-living-independently-option-0',
  });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={30} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-6">{t('apply-adult-child:living-independently.description')}</p>
        <p className="mb-4 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="living-independently"
            name="livingIndependently"
            legend={t('apply-adult-child:living-independently.form-instructions')}
            options={[
              {
                value: LivingIndependentlyOption.Yes,
                children: t('apply-adult-child:living-independently.radio-options.yes'),
                defaultChecked: defaultState === true,
              },
              {
                value: LivingIndependentlyOption.No,
                children: t('apply-adult-child:living-independently.radio-options.no'),
                defaultChecked: defaultState === false,
              },
            ]}
            required
            errorMessage={errors?.livingIndependently}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Continue - Living independently click">
              {t('apply-adult-child:living-independently.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="public/apply/$id/adult-child/date-of-birth"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult_Child:Back - Living independently click"
            >
              {t('apply-adult-child:living-independently.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
