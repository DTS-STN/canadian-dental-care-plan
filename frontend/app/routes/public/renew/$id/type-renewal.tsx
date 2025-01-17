import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, redirect, useFetcher, useLoaderData, useParams } from 'react-router';

import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { TYPES } from '~/.server/constants';
import { loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { ButtonLink } from '~/components/buttons';
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

enum RenewalType {
  Adult = 'adult',
  AdultChild = 'adult-child',
  Child = 'child',
  Delegate = 'delegate',
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('renew', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.renew.typeOfRenewal,
  pageTitleI18nKey: 'renew:type-of-renewal.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { appContainer, session }, params, request }: LoaderFunctionArgs) {
  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('renew:type-of-renewal.page-title') }) };

  return { id: state.id, meta, defaultState: state.typeOfRenewal, hasFiledTaxes: state.clientApplication?.hasFiledTaxes };
}

export async function action({ context: { appContainer, session }, params, request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.routes.security.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });
  const state = loadRenewState({ params, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for application delegate.
   */
  const typeOfRenewalSchema = z.object({
    typeOfRenewal: z.nativeEnum(RenewalType, {
      errorMap: () => ({ message: t('renew:type-of-renewal.error-message.type-of-renewal-required') }),
    }),
  });

  const parsedDataResult = typeOfRenewalSchema.safeParse({
    typeOfRenewal: String(formData.get('typeOfRenewal') ?? ''),
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(parsedDataResult.error.flatten()) }, { status: 400 });
  }

  saveRenewState({
    params,
    session,
    state: {
      editMode: false,
      typeOfRenewal: parsedDataResult.data.typeOfRenewal,
    },
  });

  if (parsedDataResult.data.typeOfRenewal === RenewalType.Adult) {
    if (state.clientApplication?.isInvitationToApplyClient) {
      return redirect(getPathById('public/renew/$id/ita/marital-status', params));
    }
    return redirect(getPathById('public/renew/$id/adult/confirm-marital-status', params));
  }

  if (parsedDataResult.data.typeOfRenewal === RenewalType.AdultChild) {
    if (state.clientApplication?.isInvitationToApplyClient) {
      return redirect(getPathById('public/renew/$id/ita/marital-status', params));
    }
    return redirect(getPathById('public/renew/$id/adult-child/confirm-marital-status', params));
  }

  if (parsedDataResult.data.typeOfRenewal === RenewalType.Child) {
    return redirect(getPathById('public/renew/$id/child/children/index', params));
  }

  return redirect(getPathById('public/renew/$id/renewal-delegate', params));
}

export default function RenewTypeOfRenewal() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, hasFiledTaxes } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = fetcher.data?.errors;
  const errorSummary = useErrorSummary(errors, { typeOfRenewal: 'input-radio-type-of-application-option-0' });

  return (
    <>
      <div className="my-6 sm:my-8">
        <Progress value={21} size="lg" label={t('apply:progress.label')} />
      </div>
      <div className="max-w-prose">
        <p className="mb-4 mt-8 italic">{t('apply:required-label')}</p>
        <errorSummary.ErrorSummary />
        <fetcher.Form method="post" noValidate>
          <CsrfTokenInput />
          <InputRadios
            id="type-of-application"
            name="typeOfRenewal"
            legend={t('renew:type-of-renewal.form-instructions')}
            options={[
              {
                value: RenewalType.Adult,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="renew:type-of-renewal.radio-options.personal" />,
                defaultChecked: defaultState === RenewalType.Adult,
              },
              {
                value: RenewalType.AdultChild,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="renew:type-of-renewal.radio-options.personal-and-child" />,
                defaultChecked: defaultState === RenewalType.AdultChild,
              },
              {
                value: RenewalType.Child,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="renew:type-of-renewal.radio-options.child" />,
                defaultChecked: defaultState === RenewalType.Child,
              },
              {
                value: RenewalType.Delegate,
                children: <Trans ns={handle.i18nNamespaces} i18nKey="renew:type-of-renewal.radio-options.delegate" />,
                defaultChecked: defaultState === RenewalType.Delegate,
              },
            ]}
            required
            errorMessage={errors?.typeOfRenewal}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton variant="primary" id="continue-button" loading={isSubmitting} endIcon={faChevronRight} data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Continue - Type of renewal click">
              {t('renew:type-of-renewal.continue-btn')}
            </LoadingButton>
            <ButtonLink
              id="back-button"
              routeId={hasFiledTaxes ? 'public/renew/$id/applicant-information' : 'public/renew/$id/tax-filing'}
              params={params}
              disabled={isSubmitting}
              startIcon={faChevronLeft}
              data-gc-analytics-customclick="ESDC-EDSC:CDCP Renew Application Form:Back - Type of renewal click"
            >
              {t('renew:type-of-renewal.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
