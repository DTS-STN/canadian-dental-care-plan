import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ButtonLink } from '~/components/buttons';
import { useErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { LoadingButton } from '~/components/loading-button';
import { Progress } from '~/components/progress';
import { pageIds } from '~/page-ids';
import { loadProtectedRenewState, saveProtectedRenewState } from '~/route-helpers/protected-renew-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { transformFlattenedError } from '~/utils/zod-utils.server';

enum RenewalType {
  AdultChild = 'adult-child',
  Child = 'child',
  Delegate = 'delegate',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-renew', 'apply', 'gcweb'),
  pageIdentifier: pageIds.protected.renew.typeOfRenewal,
  pageTitleI18nKey: 'protected-renew:type-of-renewal.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-renew:type-of-renewal.page-title') }) };

  return { id: state.id, csrfToken, meta, defaultState: state.typeOfRenewal, hasFiledTaxes: state.clientApplication?.hasFiledTaxes };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('protected-renew/type-of-renewal');
  const state = loadProtectedRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfRenewalSchema = z.object({
    typeOfRenewal: z.nativeEnum(RenewalType, {
      errorMap: () => ({ message: t('protected-renew:type-of-renewal.error-message.type-of-renewal-required') }),
    }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = { typeOfRenewal: String(formData.get('typeOfRenewal') ?? '') };
  const parsedDataResult = typeOfRenewalSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return Response.json(
      {
        errors: transformFlattenedError(parsedDataResult.error.flatten()),
      },
      { status: 400 },
    );
  }

  saveProtectedRenewState({
    params,
    session,
    state: {
      editMode: false,
      typeOfRenewal: parsedDataResult.data.typeOfRenewal,
    },
  });

  if (parsedDataResult.data.typeOfRenewal === RenewalType.AdultChild) {
    if (state.clientApplication?.isInvitationToApplyClient) {
      return redirect(getPathById('protected/renew/$id/ita/marital-status', params));
    }
    return redirect(getPathById('protected/renew/$id/adult-child/confirm-marital-status', params));
  }

  if (parsedDataResult.data.typeOfRenewal === RenewalType.Child) {
    return redirect(getPathById('protected/renew/$id/child/children/index', params));
  }

  return redirect(getPathById('protected/renew/$id/renewal-delegate', params));
}

export default function RenewTypeOfRenewal() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState, hasFiledTaxes } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { typeOfRenewal: 'input-radio-type-of-application-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={35} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 mt-8 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="type-of-application"
            name="typeOfRenewal"
            legend={t('protected-renew:type-of-renewal.form-instructions')}
            options={[
              {
                value: RenewalType.AdultChild,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:type-of-renewal.radio-options.personal-and-child" />,
                defaultChecked: defaultState === RenewalType.AdultChild,
              },
              {
                value: RenewalType.Child,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:type-of-renewal.radio-options.child" />,
                defaultChecked: defaultState === RenewalType.Child,
              },
              {
                value: RenewalType.Delegate,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="protected-renew:type-of-renewal.radio-options.delegate" />,
                defaultChecked: defaultState === RenewalType.Delegate,
              },
            ]}
            required
            errorMessage={errors?.typeOfRenewal}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renewal Form:Continue - Type of renewal click">
              {t('protected-renew:type-of-renewal.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId={hasFiledTaxes ? 'protected/renew/$id/applicant-information' : 'protected/renew/$id/tax-filing'}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Protected Renewal Form:Back - Type of renewal click"
            >
              {t('protected-renew:type-of-renewal.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
