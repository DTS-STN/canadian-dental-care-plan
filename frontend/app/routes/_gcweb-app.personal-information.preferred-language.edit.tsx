import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { sessionService } from '~/services/session-service.server';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

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

  return json({ userInfo });
}

export async function action({ request }: ActionFunctionArgs) {
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

  const session = await sessionService.getSession(request.headers.get('Cookie'));
  session.set('preferredLanguage', parsedDataResult.data.preferredLanguage);

  return redirect('/personal-information/preferred-language/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function PreferredLanguageEdit() {
  const { userInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:preferred-language.edit.page-title')}
      </h1>
      <Form method="post">
        <fieldset className="gc-chckbxrdio">
          <legend>{t('personal-information:preferred-language.edit.page-title')}</legend>
          <ul className="list-unstyled lst-spcd-2">
            <li className="radio">
              <input type="radio" name="preferredLanguage" id="preferred-language-option-en" value="en" defaultChecked={userInfo.preferredLanguage === 'en'} />
              <label htmlFor="preferred-language-option-en">{t('personal-information:preferred-language.edit.nameEn')}</label>
            </li>
            <li className="radio">
              <input type="radio" name="preferredLanguage" id="preferred-language-option-fr" value="fr" defaultChecked={userInfo.preferredLanguage === 'fr'} />
              <label htmlFor="preferred-language-option-fr">{t('personal-information:preferred-language.edit.nameFr')}</label>
            </li>
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
