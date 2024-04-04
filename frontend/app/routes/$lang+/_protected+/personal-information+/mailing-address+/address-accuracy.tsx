import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData, useParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:mailing-address.address-accuracy.breadcrumbs.personal-information',routeId: '$lang+/_protected+/personal-information+/index' },
    { labelI18nKey: 'personal-information:mailing-address.address-accuracy.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.mailingAddressAccuracy,
  pageTitleI18nKey: 'personal-information:mailing-address.address-accuracy.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  if (!data) return [];
  return getTitleMetaTags(data.meta.title);
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  if (!session.has('newMailingAddress')) {
    return redirect(getPathById('$lang+/_protected+/home', params));
  }

  const newMailingAddress = session.get('newMailingAddress');
  const countryList = await getLookupService().getAllCountries();
  const regionList = await getLookupService().getAllRegions();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:mailing-address.address-accuracy.page-title') }) };

  return json({ countryList, meta, newMailingAddress, regionList });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  return redirect(getPathById('$lang+/_protected+/personal-information+/mailing-address+/confirm', params));
}

export default function PersonalInformationMailingAddressAccuracy() {
  const { newMailingAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const params = useParams();
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
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === newMailingAddress.province)?.abbr}
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
          <ButtonLink id="cancel-button" routeId="$lang+/_protected+/personal-information+/index" params={params}>
            {t('personal-information:mailing-address.address-accuracy.cancel')}
          </ButtonLink>
          <ButtonLink id="edit-button" routeId="$lang+/_protected+/personal-information+/mailing-address+/edit" params={params}>
            {t('personal-information:mailing-address.address-accuracy.re-enter-address')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
