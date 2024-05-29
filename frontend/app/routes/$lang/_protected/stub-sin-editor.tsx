import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import md5 from 'md5';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isValidSin } from '~/utils/sin-utils';

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
  const sinToStubSchema = z.object({
    socialInsuranceNumberToStub: z.string().refine(isValidSin, { message: 'valid-sin' }),
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
  const hashedMockedSin = md5(String(sinToMock));
  const currentDateInSeconds = Math.floor(UTCDate.now() / 1000);

  const idToken = {
    iss: 'GC-ECAS',
    jti: '71b080e9-2524-4572-a085-a53e63a98116',
    nbf: currentDateInSeconds - 30,
    exp: currentDateInSeconds + 300, //five minutes TTL for the token
    iat: currentDateInSeconds,
    aud: 'CDCP',
    sub: hashedMockedSin,
    nonce: 'hqwVxGbvJ5g7NSWoOv1BvrA9avVAY7CL',
    locale: 'en-CA',
  };

  const userinfoTokenPayload = {
    aud: 'CDCP',
    birthdate: '2000-01-01',
    iss: 'GC-ECAS-MOCK',
    locale: 'en-CA',
    //TODO implement a future PR to have this value dynamic
    sid: '76c48130-e1d4-4c2f-8dd0-1c17f9bbb4f6',
    sin: sinToMock,
    sub: hashedMockedSin,
    mocked: true,
  };
  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  if (!session.has('userInfoToken')) {
    session.set('userInfoToken', userinfoTokenPayload);
  } else {
    userInfoToken.sin = sinToMock;
    userInfoToken.sub = hashedMockedSin;
    session.set('userInfoToken', userInfoToken);
  }
  session.set('idToken', idToken);

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
        <Button variant="primary" id="continue-button">
          {t('stub-sin-editor:index.edit-id-button')}
        </Button>
      </Form>
    </>
  );
}
