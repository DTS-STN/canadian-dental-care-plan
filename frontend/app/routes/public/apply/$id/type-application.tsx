import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { loadApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum ApplicantType {
  Adult = 'adult',
  AdultChild = 'adult-child',
  Child = 'child',
  Delegate = 'delegate',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.typeOfApplication,
  pageTitleI18nKey: 'apply:type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:type-of-application.page-title') }) };

  return { id: state.id, csrfToken, meta, defaultState: state.typeOfApplication };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/type-of-application');
  loadApplyState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfApplicationSchema = z.object({
    typeOfApplication: z.nativeEnum(ApplicantType, {
      errorMap: () => ({ message: t('apply:type-of-application.error-message.type-of-application-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { typeOfApplication: String(formData.get('typeOfApplication') ?? '') };
  const parsedDataResult = typeOfApplicationSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveApplyState({
    params,
    session,
    state: {
      editMode: false,
      typeOfApplication: parsedDataResult.data.typeOfApplication,
    },
  });

  if (parsedDataResult.data.typeOfApplication === ApplicantType.Adult) {
    return redirect(getPathById('public/apply/$id/adult/tax-filing', params));
  }

  if (parsedDataResult.data.typeOfApplication === ApplicantType.AdultChild) {
    return redirect(getPathById('public/apply/$id/adult-child/tax-filing', params));
  }

  if (parsedDataResult.data.typeOfApplication === ApplicantType.Child) {
    return redirect(getPathById('public/apply/$id/child/tax-filing', params));
  }

  return redirect(getPathById('public/apply/$id/application-delegate', params));
}

export default function ApplyFlowTypeOfApplication() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { typeOfApplication: 'input-radio-type-of-application-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={10} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-6">{t('apply:type-of-application.page-description')}</p>
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="font-lato text-lg font-bold">{t('apply:type-of-application.apply-self')}</h2>
            <p>{t('apply:type-of-application.apply-self-eligibility')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:type-of-application.senior')}</li>
              <li>{t('apply:type-of-application.valid-disability-tax-credit')}</li>
              <li>{t('apply:type-of-application.live-independently')}</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="font-lato text-lg font-bold">{t('apply:type-of-application.apply-child')}</h2>
            <p>{t('apply:type-of-application.apply-child-eligibility')}</p>
            <ul className="list-disc space-y-1 pl-7">
              <li>{t('apply:type-of-application.sixteen-or-older')}</li>
              <li>{t('apply:type-of-application.under-eighteen')}</li>
            </ul>
            <Collapsible summary={t('apply:type-of-application.split-custody-summary')}>
              <div className="space-y-4">
                <p>{t('apply:type-of-application.multiple-application')}</p>
                <p>{t('apply:type-of-application.split-custody-detail')}</p>
              </div>
            </Collapsible>
          </section>
        </div>
        <p className="mb-4 mt-8 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="type-of-application"
            name="typeOfApplication"
            legend={t('apply:type-of-application.form-instructions')}
            options={[
              {
                value: ApplicantType.Adult,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.personal" />,
                defaultChecked: defaultState === ApplicantType.Adult,
              },
              {
                value: ApplicantType.Child,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.child" />,
                defaultChecked: defaultState === ApplicantType.Child,
              },
              {
                value: ApplicantType.AdultChild,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.personal-and-child" />,
                defaultChecked: defaultState === ApplicantType.AdultChild,
              },
              {
                value: ApplicantType.Delegate,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="apply:type-of-application.radio-options.delegate" />,
                defaultChecked: defaultState === ApplicantType.Delegate,
              },
            ]}
            required
            errorMessage={errors?.typeOfApplication}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Type of application click">
              {t('apply:type-of-application.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId="public/apply/$id/terms-and-conditions"
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Type of application click"
            >
              {t('apply:type-of-application.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
