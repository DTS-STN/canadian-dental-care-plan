import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InputRadios } from '~/components/input-radios';
import { getLookupService } from '~/services/lookup-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { PREFERRED_LANGUAGES } from '~/utils/constants';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:preferred-language.edit.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:preferred-language.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:preferred-language.edit.page-title' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0012',
  pageTitleI18nKey: 'personal-information:preferred-language.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
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
  const formDataSchema = z.object({
    preferredLanguage: z.enum(PREFERRED_LANGUAGES),
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
  session.set('preferredLanguage', parsedDataResult.data.preferredLanguage);

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
      <Form method="post">
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
        <div className="flex flex-wrap gap-3">
          <button id="change-button" className="btn btn-primary btn-lg">
            {t('personal-information:preferred-language.edit.change')}
          </button>
          <Link id="cancel-button" to="/personal-information" className="btn btn-default btn-lg">
            {t('personal-information:preferred-language.edit.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
