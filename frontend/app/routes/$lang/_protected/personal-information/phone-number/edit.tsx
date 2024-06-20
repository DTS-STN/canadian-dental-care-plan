import { useEffect, useMemo } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { PersonalInformation } from '~/schemas/personal-informaton-service-schemas.server';
import { getAuditService } from '~/services/audit-service.server';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import { IdToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.personal-information', routeId: '$lang/_protected/personal-information/index' },
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.change-phone-number' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.telephoneNumberEdit,
  pageTitleI18nKey: 'personal-information:phone-number.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, request, params }: LoaderFunctionArgs) {
  featureEnabled('edit-personal-info');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const csrfToken = String(session.get('csrfToken'));

  const personalInformationRouteHelper = getPersonalInformationRouteHelpers();

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const personalInformation: PersonalInformation = await personalInformationRouteHelper.getPersonalInformation(userInfoToken, params, request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:phone-number.edit.page-title') }) };

  instrumentationService.countHttpStatus('phone-number.edit', 200);
  return json({ csrfToken, meta, personalInformation });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  featureEnabled('edit-personal-info');
  const log = getLogger('phone-number/edit');
  const personalInformationService = getPersonalInformationService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const personalInformationRouteHelper = getPersonalInformationRouteHelpers();

  const userInfoTokenAction: UserinfoToken = session.get('userInfoToken');
  const personalInformation: PersonalInformation = await personalInformationRouteHelper.getPersonalInformation(userInfoTokenAction, params, request, session);

  const t = await getFixedT(request, handle.i18nNamespaces);
  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z.object({
    primaryTelephoneNumber: z

      .string()
      .trim()
      .max(100)
      .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('personal-information:phone-number.edit.error-message.invalid-phone-format'))
      .transform((val) => parsePhoneNumber(val, 'CA').formatInternational())
      .optional(),
    alternateTelephoneNumber: z
      .string()
      .trim()
      .max(100)
      .refine((val) => !val || isValidPhoneNumber(val, 'CA'), t('personal-information:phone-number.edit.error-message.invalid-phone-format'))
      .transform((val) => parsePhoneNumber(val, 'CA').formatInternational())
      .optional(),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));
  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }
  const data = {
    primaryTelephoneNumber: formData.get('primaryTelephoneNumber') ? String(formData.get('primaryTelephoneNumber')) : undefined,
    alternateTelephoneNumber: formData.get('alternateTelephoneNumber') ? String(formData.get('alternateTelephoneNumber')) : undefined,
  };

  const parsedDataResult = formDataSchema.safeParse(data);

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('phone-number.confirm', 400);
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }
  personalInformation.primaryTelephoneNumber = parsedDataResult.data.primaryTelephoneNumber;
  personalInformation.alternateTelephoneNumber = parsedDataResult.data.alternateTelephoneNumber;

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  await personalInformationService.updatePersonalInformation(userInfoToken.sin, personalInformation);
  session.set('personalInformation', personalInformation);
  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.phone-number', { userId: idToken.sub });

  instrumentationService.countHttpStatus('phone-number.confirm', 302);
  session.set('personal-info-updated', true);
  return redirect(getPathById('$lang/_protected/personal-information/index', params));
}

export default function PhoneNumberEdit() {
  const fetcher = useFetcher<typeof action>();
  const { csrfToken, personalInformation } = useLoaderData<typeof loader>();
  const params = useParams();
  const errorSummaryId = 'error-summary';
  const isSubmitting = fetcher.state !== 'idle';
  const { t } = useTranslation(handle.i18nNamespaces);

  const defaultValues = {
    primaryTelephoneNumber: personalInformation.primaryTelephoneNumber ?? '',
    alternateTelephoneNumber: personalInformation.alternateTelephoneNumber ?? '',
  };
  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      primaryTelephoneNumber: fetcher.data?.errors.primaryTelephoneNumber?._errors[0],
      alternateTelephoneNumber: fetcher.data?.errors.alternateTelephoneNumber?._errors[0],
    }),
    [fetcher.data?.errors.primaryTelephoneNumber?._errors, fetcher.data?.errors.alternateTelephoneNumber?._errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);
  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="grid gap-6">
          <InputField
            id="primaryTelephoneNumber"
            name="primaryTelephoneNumber"
            type="tel"
            label={t('personal-information:phone-number.edit.component.phone')}
            defaultValue={defaultValues.primaryTelephoneNumber}
            errorMessage={errorMessages.primaryTelephoneNumber}
          />
          <InputField
            id="alternateTelephoneNumber"
            name="alternateTelephoneNumber"
            type="tel"
            label={t('personal-information:phone-number.edit.component.alternate-phone')}
            defaultValue={defaultValues.alternateTelephoneNumber}
            errorMessage={errorMessages.alternateTelephoneNumber}
          />
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:my-4">
          <ButtonLink id="cancel" routeId="$lang/_protected/personal-information/index" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Cancel - Phone number click">
            {t('personal-information:phone-number.edit.button.cancel')}
          </ButtonLink>
          <Button id="submit" variant="primary" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Personal Information:Save - Phone number click">
            {t('personal-information:phone-number.edit.button.save')}
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
