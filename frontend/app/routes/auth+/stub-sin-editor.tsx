import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { getSessionService } from '~/services/session-service.server';
import { getEnv } from '~/utils/env.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { isValidSin } from '~/utils/sin-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('stubSinEditor', 'gcweb'),
  pageIdentifier: 'CDCP-00XX',
  pageTitleI18nKey: 'apply:index.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('stubSinEditor:index.page-title') }) };
  const { SHOW_SIN_EDIT_STUB_PAGE } = getEnv();

  //const sessionService = await getSessionService();
  //const session = await sessionService.getSession(request);

  if (!SHOW_SIN_EDIT_STUB_PAGE) {
    throw new Response(null, { status: 404 });
  }
  return { meta };
}

export async function action({ request }: ActionFunctionArgs) {
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
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
  const idToken = {
    iss: 'GC-ECAS',
    jti: '71b080e9-2524-4572-a085-a53e63a98116',
    nbf: 1655740836,
    exp: 1655741166,
    iat: 1655740866,
    aud: 'CALSC',
    sub: '6034f978-7243-426a-9380-4022c06280e1',
    nonce: 'hqwVxGbvJ5g7NSWoOv1BvrA9avVAY7CL',
    locale: 'en-CA',
  };

  session.set('idToken', idToken);
  return redirectWithLocale(request, `/`, {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
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
    return t(`stubSinEditor:index.error-message.${errorI18nKey}` as any);
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
        <InputField id="socialInsuranceNumberToStub" name="socialInsuranceNumberToStub" label={t('stubSinEditor:index.edit-id-field')} required inputMode="numeric" pattern="\d{9}" placeholder="000-000-000" minLength={9} maxLength={9} />
        <Button variant="primary" id="continue-button">
          {t('stubSinEditor:index.edit-id-button')}
        </Button>
      </Form>
    </>
  );
}
