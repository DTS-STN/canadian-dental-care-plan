import { useEffect } from 'react';

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import type { RouteHandleData } from '~/utils/route-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('stub-sin-editor', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'stub-sin-editor:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const { SHOW_SIN_EDIT_STUB_PAGE } = getEnv();
  if (!SHOW_SIN_EDIT_STUB_PAGE) {
    throw new Response(null, { status: 404 });
  }
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('stub-sin-editor:index.page-title') }) };

  return { meta };
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  // TODO SHOW_SIN_EDIT_STUB_PAGE should be added as a feature flag
  const { SHOW_SIN_EDIT_STUB_PAGE } = getEnv();
  if (!SHOW_SIN_EDIT_STUB_PAGE) {
    throw new Response(null, { status: 404 });
  }

  const sinToStubSchema = z.object({
    socialInsuranceNumberToStub: z.string(),
    userUUIDToStub: z.string(),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = sinToStubSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof sinToStubSchema>>,
    });
  }

  const sinToMock = parsedDataResult.data.socialInsuranceNumberToStub;
  const currentDateInSeconds = Math.floor(UTCDate.now() / 1000);
  const userStubUUID = parsedDataResult.data.userUUIDToStub;

  const idToken = {
    iss: 'GC-ECAS',
    jti: '71b080e9-2524-4572-a085-a53e63a98116',
    nbf: currentDateInSeconds - 30,
    exp: currentDateInSeconds + 300, //five minutes TTL for the token
    iat: currentDateInSeconds,
    aud: 'CDCP',
    sub: userStubUUID,
    nonce: 'hqwVxGbvJ5g7NSWoOv1BvrA9avVAY7CL',
    locale: 'en-CA',
  };

  const userinfoTokenPayload = {
    aud: 'CDCP',
    birthdate: '2000-01-01',
    iss: 'GC-ECAS-MOCK',
    locale: 'en-CA',
    //TODO implement a future PR to have this value dynamic
    sid: userStubUUID,
    sin: sinToMock,
    sub: userStubUUID,
    mocked: true,
  };
  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  if (!session.has('userInfoToken')) {
    session.set('userInfoToken', userinfoTokenPayload);
  } else {
    userInfoToken.sin = sinToMock;
    userInfoToken.sub = userStubUUID;
    session.set('userInfoToken', userInfoToken);
  }
  session.set('idToken', idToken);

  const subscriptionService = getSubscriptionService();
  const user = await subscriptionService.getUserByRaoidcUserId(session.get('userInfoToken').sub);
  session.set('userId', user?.id);

  return redirect(getPathById('$lang/_protected/home', params));
}

export default function StubSinEditorPage() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const actionData = useActionData<typeof action>();

  const errorSummaryId = 'error-summary';

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
    return t(`stub-sin-editor:index.error-message.${errorI18nKey}` as any);
  }
  const errorMessages = {
    socialInsuranceNumber: getErrorMessage(actionData?.errors.socialInsuranceNumberToStub?._errors[0]),
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
      <Form method="post" noValidate className="space-y-6">
        <InputField id="socialInsuranceNumberToStub" name="socialInsuranceNumberToStub" label={t('stub-sin-editor:index.edit-id-field')} required inputMode="numeric" pattern="\d{9}" placeholder="000000000" minLength={9} maxLength={9} />
        <InputField id="userUUIDToStub" name="userUUIDToStub" inputMode="text" label={t('stub-sin-editor:index.UUID-label')} placeholder="00000000-0000-0000-0000-000000000000" />
        <Button variant="primary" id="continue-button">
          {t('stub-sin-editor:index.edit-id-button')}
        </Button>
      </Form>
    </>
  );
}
