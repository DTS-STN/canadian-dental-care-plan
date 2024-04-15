import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useParams } from '@remix-run/react';

import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { redirectWithSuccess } from 'remix-toast';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getPersonalInformationRouteHelpers } from '~/route-helpers/personal-information-route-helpers.server';
import { PersonalInfo } from '~/schemas/personal-informaton-service-schemas.server';
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

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.personal-information', routeId: '$lang+/_protected+/personal-information+/index' },
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
  const personalInformation = await personalInformationRouteHelper.getPersonalInformation(userInfoToken, params, request, session);

  session.set('personalInformation', personalInformation);
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:phone-number.edit.page-title') }) };

  instrumentationService.countHttpStatus('phone-number.edit', 200);
  return json({ csrfToken, meta, personalInformation });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('phone-number/edit');
  const personalInformationService = await getPersonalInformationService();
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const personalInformation: PersonalInfo = session.get('personalInformation');

  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z.object({
    phoneNumber: z
      .string()
      .min(1, { message: 'empty-phone-number' })
      .refine((val) => isValidPhoneNumber(val, 'CA'), { message: 'invalid-phone-format' }),

    alternatePhoneNumber: z
      .string()
      .refine(
        (val) => {
          if (val.length === 0) {
            return true;
          } else {
            return isValidPhoneNumber(val, 'CA');
          }
        },
        { message: 'invalid-phone-format' },
      )
      .optional(),
  });

  const formData = Object.fromEntries(await request.formData());
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData['_csrf']);

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('phone-number.confirm', 400);
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }
  personalInformation.primaryTelephoneNumber = parsedDataResult.data.phoneNumber;
  personalInformation.alternateTelephoneNumber = parsedDataResult.data.alternatePhoneNumber;
  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  personalInformationService.updatePersonalInformation(userInfoToken.sin!, personalInformation);

  const idToken: IdToken = session.get('idToken');
  getAuditService().audit('update-data.phone-number', { userId: idToken.sub });

  instrumentationService.countHttpStatus('phone-number.confirm', 302);
  return redirectWithSuccess(getPathById('$lang+/_protected+/personal-information+/index', params), 'personal-information:phone-number.confirm.updated-notification');
}

export default function PhoneNumberEdit() {
  const { csrfToken, personalInformation } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const params = useParams();
  const errorSummaryId = 'error-summary';

  const { t } = useTranslation(handle.i18nNamespaces);

  const defaultValues = {
    phoneNumber: personalInformation.primaryTelephoneNumber ?? '',
    alternatePhoneNumber: personalInformation.alternateTelephoneNumber ?? '',
  };
  t;

  /**
   * Gets an error message based on the provided internationalization (i18n) key.
   *
   * @param errorI18nKey - The i18n key for the error message.
   * @returns The corresponding error message, or undefined if no key is provided.
   */
  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;

    /**
     * The 'as any' is employed to circumvent typechecking, as the type of
     * 'errorI18nKey' is a string, and the string literal cannot undergo validation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`personal-information:phone-number.edit.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    phoneNumber: getErrorMessage(actionData?.errors.phoneNumber?._errors[0]),
    alternatePhoneNumber: getErrorMessage(actionData?.errors.alternatePhoneNumber?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div className="my-6">
          <InputField id="phoneNumber" name="phoneNumber" type="tel" label={t('personal-information:phone-number.edit.component.phone')} defaultValue={defaultValues.phoneNumber} errorMessage={errorMessages.phoneNumber} />
          <InputField
            id="alternatePhoneNumber"
            name="alternatePhoneNumber"
            type="tel"
            label={t('personal-information:phone-number.edit.component.alternate-phone')}
            defaultValue={defaultValues.alternatePhoneNumber}
            errorMessage={errorMessages.alternatePhoneNumber}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink id="cancel" routeId="$lang+/_protected+/personal-information+/index" params={params}>
            {t('personal-information:phone-number.edit.button.cancel')}
          </ButtonLink>
          <Button id="submit" variant="primary">
            {t('personal-information:phone-number.edit.button.save')}
          </Button>
        </div>
      </Form>
    </>
  );
}
