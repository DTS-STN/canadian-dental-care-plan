import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, MetaFunction, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:mailing-address.address-accuracy.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.address-accuracy.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: 'CDCP-0014',
  pageTitleI18nKey: 'personal-information:mailing-address.address-accuracy.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta((args) => {
  const { t } = useTranslation(handle.i18nNamespaces);
  return [{ title: t('gcweb:meta.title.template', { title: t('personal-information:mailing-address.address-accuracy.page-title') }) }];
});

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  if (!session.has('newMailingAddress')) {
    return redirect('/');
  }

  const newMailingAddress = session.get('newMailingAddress');
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  return json({ newMailingAddress, countryList, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);
  return redirect('/personal-information/mailing-address/confirm');
}

export default function PersonalInformationMailingAddressAccuracy() {
  const { newMailingAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:mailing-address.address-accuracy.subtitle')}</p>
      <Form method="post" noValidate>
        <p className="mb-4">{t('personal-information:mailing-address.address-accuracy.invalid-address-info')}</p>
        <p>{t('personal-information:mailing-address.address-accuracy.note')}</p>
        <dl className="my-6 divide-y border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:mailing-address.address-accuracy.requested-change')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              {newMailingAddress ? (
                <Address
                  address={newMailingAddress.address}
                  city={newMailingAddress.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === newMailingAddress.province)?.provinceTerritoryStateId}
                  postalZipCode={newMailingAddress.postalCode}
                  country={countryList.find((country) => country.countryId === newMailingAddress.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="confirm-button" variant="primary">
            {t('personal-information:mailing-address.address-accuracy.continue')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information/">
            {t('personal-information:mailing-address.address-accuracy.cancel')}
          </ButtonLink>
          <ButtonLink id="edit-button" to="/personal-information/mailing-address/edit">
            {t('personal-information:mailing-address.address-accuracy.re-enter-address')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
