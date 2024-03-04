import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information', 'gcweb');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:preferred-language.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:preferred-language.edit.page-title' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0012',
  pageTitleI18nKey: 'personal-information:preferred-language.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const userService = getUserService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  const preferredLanguages = await getLookupService().getAllPreferredLanguages();
  return json({ userInfo, preferredLanguages });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const formDataSchema = z.object({
    preferredLanguage: z.enum(['en', 'fr']),
  });
  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);
  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  session.set('newPreferredLanguage', parsedDataResult.data.preferredLanguage);

  return redirect('/personal-information/preferred-language/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PreferredLanguageEdit() {
  const { userInfo, preferredLanguages } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:preferred-language.edit.subtitle')}</p>
      <Form method="post" noValidate>
        <div className="my-6">
          <p className="mb-4 text-red-600">{t('gcweb:asterisk-indicates-required-field')}</p>
          {preferredLanguages.length > 0 && (
            <InputRadios
              id="preferred-language"
              name="preferredLanguage"
              legend={t('personal-information:preferred-language.edit.page-title')}
              options={preferredLanguages.map((language) => ({
                defaultChecked: userInfo.preferredLanguage === language.id,
                children: getNameByLanguage(i18n.language, language),
                value: language.id,
              }))}
              required
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="change-button" variant="primary">
            {t('personal-information:preferred-language.edit.change')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information">
            {t('personal-information:preferred-language.edit.cancel')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
