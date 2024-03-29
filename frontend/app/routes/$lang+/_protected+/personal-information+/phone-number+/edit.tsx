import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:phone-number.edit.breadcrumbs.change-phone-number' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.telephoneNumberEdit,
  pageTitleI18nKey: 'personal-information:phone-number.edit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();
  const userService = getUserService();

  await raoidcService.handleSessionValidation(request, session);

  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    instrumentationService.countHttpStatus('phone-number.edit', 404);
    throw new Response(null, { status: 404 });
  }

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:phone-number.edit.page-title') }) };

  instrumentationService.countHttpStatus('phone-number.edit', 200);
  return json({ meta, userInfo });
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const formDataSchema = z.object({
    phoneNumber: z
      .string()
      .min(1, { message: 'empty-phone-number' })
      .refine((val) => isValidPhoneNumber(val, 'CA'), { message: 'invalid-phone-format' }),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    instrumentationService.countHttpStatus('phone-number.confirm', 400);
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  session.set('newPhoneNumber', parsedDataResult.data.phoneNumber);

  instrumentationService.countHttpStatus('phone-number.confirm', 302);
  return redirectWithLocale(request, '/personal-information/phone-number/confirm');
}

export default function PhoneNumberEdit() {
  const { userInfo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errorSummaryId = 'error-summary';

  const { t } = useTranslation(handle.i18nNamespaces);

  const defaultValues = {
    phoneNumber: actionData?.formData.phoneNumber ?? userInfo.phoneNumber ?? '',
  };

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
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (actionData?.formData && hasErrors(actionData.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [actionData]);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:phone-number.edit.subtitle')}</p>
      {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
      <Form method="post" noValidate>
        <div className="my-6">
          <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
          <InputField id="phoneNumber" name="phoneNumber" type="tel" label={t('personal-information:phone-number.edit.component.phone')} required defaultValue={defaultValues.phoneNumber} errorMessage={errorMessages.phoneNumber} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="submit" variant="primary">
            {t('personal-information:phone-number.edit.button.save')}
          </Button>
          <ButtonLink id="cancel" to="/personal-information">
            {t('personal-information:phone-number.edit.button.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
