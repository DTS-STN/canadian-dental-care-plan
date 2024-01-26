import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { lookupService } from '~/services/lookup-service.server';
import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { PREFFERRED_LANGUAGES } from '~/utils/constants';
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
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  const preferredLanguageList = userInfo?.preferredLanguage ? await lookupService.getAllPreferredLanguages() : undefined;
  return json({ userInfo, preferredLanguageList });
}

export async function action({ request }: ActionFunctionArgs) {
  const formDataSchema = z.object({
    preferredLanguage: z.enum(PREFFERRED_LANGUAGES),
  });
  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formDataSchema.safeParse(formData);
  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const session = await sessionService.getSession(request.headers.get('Cookie'));
  session.set('preferredLanguage', parsedDataResult.data.preferredLanguage);

  const userId = await userService.getUserId();
  await userService.updateUserInfo(userId, parsedDataResult.data);
  return redirect('/personal-information/preferred-language/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PreferredLanguageEdit() {
  const { userInfo, preferredLanguageList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:preferred-language.edit.page-title')}
      </h1>
      <Form method="post">
        <fieldset className="gc-chckbxrdio">
          <legend>{t('personal-information:preferred-language.edit.page-title')}</legend>
          <ul className="list-unstyled lst-spcd-2">
            {preferredLanguageList?.map((language) => {
              const radioId = `preferred-language-option-${language.id}`;
              return (
                <li key={radioId} className="radio">
                  <input type="radio" name="preferredLanguage" id={radioId} value={language.id} defaultChecked={userInfo.preferredLanguage === language.id} />
                  <label htmlFor={radioId}> {getNameByLanguage(i18n.language, language)} </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <div className="form-group">
          <ul className="list-inline lst-spcd">
            <li>
              <button id="change-button" className="btn btn-primary btn-lg">
                {t('personal-information:preferred-language.edit.change')}
              </button>
            </li>
            <li>
              <Link id="cancel-button" to="/personal-information" className="btn btn-default btn-lg">
                {t('personal-information:preferred-language.edit.cancel')}
              </Link>
            </li>
          </ul>
        </div>
      </Form>
    </>
  );
}
