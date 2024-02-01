import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Form, Link } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { InputField } from '~/components/input-field';
import { userService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.edit.breadcrumbs.home-address-change' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0004',
  pageTitleI18nKey: 'personal-information:address.edit.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ userInfo });
}

export default function ChangeAddress() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:home-address.edit.page-title')}
      </h1>
      <Form method="post">
        <InputField id="address" label={t('personal-information:home-address.edit.field.address')} name="address" required />
        <InputField id="city" label={t('personal-information:home-address.edit.field.city')} name="city" required />
        <InputField id="province" label={t('personal-information:home-address.edit.field.province')} name="province" />
        <InputField id="postalCode" label={t('personal-information:home-address.edit.field.postal-code')} name="postalCode" />
        <InputField id="country" label={t('personal-information:home-address.edit.field.country')} name="country" required />

        <div className="flex flex-wrap gap-3">
          <button id="change-button" className="btn btn-primary btn-lg">
            {t('personal-information:home-address.edit.button.change')}
          </button>
          <Link id="cancel-button" to="/personal-information" className="btn btn-default btn-lg">
            {t('personal-information:home-address.edit.button.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
