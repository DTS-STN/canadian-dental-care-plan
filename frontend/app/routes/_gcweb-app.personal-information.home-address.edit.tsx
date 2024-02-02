import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InputField } from '~/components/input-field';
import { addressService } from '~/services/address-service.server';
import { sessionService } from '~/services/session-service.server';
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
  const addressInfo = await addressService.getAddressInfo(userId, userInfo?.homeAddress ?? '');

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }

  return json({ addressInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const isValidAddress = (val: object) => val && addressService.isValidAddress(val);

  const formDataSchema = z
    .object({
      addressApartmentUnitNumber: z.string().transform((val) => val.trim()),
      addressStreet: z
        .string()
        .min(1, { message: 'empty-home-address' })
        .transform((val) => val.trim()),
      addressCity: z
        .string()
        .min(1, { message: 'empty-home-address' })
        .transform((val) => val.trim()),
      addressProvince: z.string().transform((val) => val.trim()),
      addressPostalZipCode: z.string().transform((val) => val.trim()),
      addressCountry: z
        .string()
        .min(1, { message: 'empty-home-address' })
        .transform((val) => val.trim()),
    })
    .refine(isValidAddress, { message: 'invalid-home-address' });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = await formDataSchema.safeParseAsync(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.flatten(),
      formData: formData as Partial<z.infer<typeof formDataSchema>>,
    });
  }

  const session = await sessionService.getSession(request.headers.get('Cookie'));
  session.set('newHomeAddress', parsedDataResult.data);

  return redirect('/personal-information/home-address/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function ChangeAddress() {
  const { addressInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  const defaultValues = addressInfo
    ? {
        id: addressInfo.id,
        addressApartmentUnitNumber: addressInfo.addressApartmentUnitNumber,
        addressStreet: addressInfo.addressStreet,
        addressCity: addressInfo.addressCity,
        addressProvince: addressInfo.addressProvince,
        addressPostalZipCode: addressInfo.addressPostalZipCode,
        addressCountry: addressInfo.addressCountry,
      }
    : {
        id: '',
        addressApartmentUnitNumber: '',
        addressStreet: '',
        addressCity: '',
        addressProvince: '',
        addressPostalZipCode: '',
        addressCountry: '',
      };

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:home-address.edit.page-title')}
      </h1>
      <Form method="post">
        <InputField id="unit" label="Unit" name="addressApartmentUnitNumber" defaultValue={defaultValues.addressApartmentUnitNumber} />
        <InputField id="address" label={t('personal-information:home-address.edit.field.address')} name="addressStreet" required defaultValue={defaultValues.addressStreet} />
        <InputField id="city" label={t('personal-information:home-address.edit.field.city')} name="addressCity" required defaultValue={defaultValues.addressCity} />
        <InputField id="province" label={t('personal-information:home-address.edit.field.province')} name="addressProvince" defaultValue={defaultValues.addressProvince} />
        <InputField id="postalCode" label={t('personal-information:home-address.edit.field.postal-code')} name="addressPostalZipCode" defaultValue={defaultValues.addressPostalZipCode} />
        <InputField id="country" label={t('personal-information:home-address.edit.field.country')} name="addressCountry" required defaultValue={defaultValues.addressCountry} />

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
