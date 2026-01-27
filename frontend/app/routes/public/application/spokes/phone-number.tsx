import { data, redirect, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Route } from './+types/phone-number';

import { TYPES } from '~/.server/constants';
import { getPublicApplicationState, savePublicApplicationState, validateApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import type { ApplicationFlow } from '~/.server/routes/helpers/public-application-route-helpers';
import { getFixedT } from '~/.server/utils/locale.utils';
import { transformFlattenedError } from '~/.server/utils/zod.utils';
import { phoneSchema } from '~/.server/validation/phone-schema';
import { ButtonLink } from '~/components/buttons';
import { Collapsible } from '~/components/collapsible';
import { CsrfTokenInput } from '~/components/csrf-token-input';
import { useErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/inline-link';
import { InputPhoneField } from '~/components/input-phone-field';
import { LoadingButton } from '~/components/loading-button';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

function getRouteFromApplicationFlow(applicationFlow: ApplicationFlow) {
  switch (applicationFlow) {
    case 'full-children': {
      return `public/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    case 'simplified-children': {
      return `public/application/$id/${applicationFlow}/parent-or-guardian`;
    }
    default: {
      return `public/application/$id/${applicationFlow}/contact-information`;
    }
  }
}

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('application-spokes', 'application', 'gcweb'),
  pageIdentifier: pageIds.public.application.spokes.phoneNumber,
  pageTitleI18nKey: 'application-spokes:phone-number.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationFlow(state, params, ['simplified-adult', 'full-adult', 'full-children', 'full-family', 'simplified-family', 'simplified-children']);

  const t = await getFixedT(request, handle.i18nNamespaces);

  const meta = { title: t('gcweb:meta.title.template', { title: t('application-spokes:phone-number.page-title') }) };
  return {
    defaultState: {
      phoneNumber: state.phoneNumber?.value?.primary,
      phoneNumberAlt: state.phoneNumber?.value?.alternate,
    },
    applicationFlow: `${state.inputModel}-${state.typeOfApplication}` as const,
    meta,
  };
}

export async function action({ context: { appContainer, session }, params, request }: Route.ActionArgs) {
  const state = getPublicApplicationState({ params, session });
  validateApplicationFlow(state, params, ['full-adult', 'full-children', 'full-family', 'simplified-adult', 'simplified-family', 'simplified-children']);

  const formData = await request.formData();

  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  securityHandler.validateCsrfToken({ formData, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const applicationFlow: ApplicationFlow = `${state.inputModel}-${state.typeOfApplication}`;

  const phoneNumberSchema = z.object({
    phoneNumber: phoneSchema({
      invalid_phone_canadian_error: t('application-spokes:phone-number.error-message.phone-number-valid'),
      invalid_phone_international_error: t('application-spokes:phone-number.error-message.phone-number-valid-international'),
    }),
    phoneNumberAlt: phoneSchema({
      invalid_phone_canadian_error: t('application-spokes:phone-number.error-message.phone-number-alt-valid'),
      invalid_phone_international_error: t('application-spokes:phone-number.error-message.phone-number-alt-valid-international'),
    }).optional(),
  });

  const parsedDataResult = phoneNumberSchema.safeParse({
    phoneNumber: formData.get('phoneNumber')?.toString(),
    phoneNumberAlt: formData.get('phoneNumberAlt') ? String(formData.get('phoneNumberAlt')) : undefined,
  });

  if (!parsedDataResult.success) {
    return data({ errors: transformFlattenedError(z.flattenError(parsedDataResult.error)) }, { status: 400 });
  }

  savePublicApplicationState({
    params,
    session,
    state: {
      phoneNumber: {
        hasChanged: true,
        value: {
          primary: parsedDataResult.data.phoneNumber,
          alternate: parsedDataResult.data.phoneNumberAlt,
        },
      },
    },
  });

  return redirect(getPathById(getRouteFromApplicationFlow(applicationFlow), params));
}

export default function PhoneNumber({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { defaultState, applicationFlow } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const errors = typeof fetcher.data === 'object' && 'errors' in fetcher.data ? fetcher.data.errors : undefined;

  const errorSummary = useErrorSummary(errors, {
    phoneNumber: 'phone-number',
    phoneNumberAlt: 'phone-number-alt',
  });

  const findOffice = <InlineLink to={t('application-spokes:phone-number.office-link')} className="external-link" newTabIndicator target="_blank" />;

  return (
    <div className="max-w-prose">
      <errorSummary.ErrorSummary />
      <fetcher.Form method="post" noValidate>
        <CsrfTokenInput />
        <div className="mb-6">
          <p className="mb-4 italic">{t('application:optional-label')}</p>
          <div className="grid items-end gap-6">
            <InputPhoneField
              id="phone-number"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              className="w-full"
              autoComplete="tel"
              defaultValue={defaultState.phoneNumber ?? ''}
              errorMessage={errors?.phoneNumber}
              label={t('application-spokes:phone-number.phone-number')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
            <InputPhoneField
              id="phone-number-alt"
              name="phoneNumberAlt"
              type="tel"
              inputMode="tel"
              className="w-full"
              autoComplete="tel"
              defaultValue={defaultState.phoneNumberAlt ?? ''}
              errorMessage={errors?.phoneNumberAlt}
              label={t('application-spokes:phone-number.phone-number-alt')}
              maxLength={100}
              aria-describedby="adding-phone"
            />
          </div>
        </div>
        <Collapsible summary={t('application-spokes:phone-number.dont-have-number')}>
          <div className="space-y-6">
            <section className="space-y-4">
              <p>{t('application-spokes:phone-number.need-phone-number')}</p>
              <ul className="list-disc space-y-1 pl-7">
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:phone-number.service-canada" components={{ noWrap: <span className="whitespace-nowrap" /> }} />
                </li>
                <li>
                  <Trans ns={handle.i18nNamespaces} i18nKey="application-spokes:phone-number.in-person" components={{ findOffice }} />
                </li>
              </ul>
            </section>
          </div>
        </Collapsible>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <LoadingButton variant="primary" id="save-button" loading={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Save - Phone number click">
            {t('application-spokes:phone-number.save-btn')}
          </LoadingButton>
          <ButtonLink
            id="back-button"
            variant="secondary"
            routeId={getRouteFromApplicationFlow(applicationFlow)}
            params={params}
            disabled={isSubmitting}
            data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form-Adult:Back - Phone number click"
          >
            {t('application-spokes:phone-number.back-btn')}
          </ButtonLink>
        </div>
      </fetcher.Form>
    </div>
  );
}
