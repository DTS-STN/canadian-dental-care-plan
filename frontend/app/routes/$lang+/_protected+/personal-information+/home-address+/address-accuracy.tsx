import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getPersonalInformationService } from '~/services/personal-information-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import type { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.address-accuracy.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.address-accuracy.page-title' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.homeAddressAccuracy,
  pageTitleI18nKey: 'personal-information:home-address.address-accuracy.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request }: LoaderFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();
  const sessionService = await getSessionService();
  const personalInformationService = await getPersonalInformationService();
  await raoidcService.handleSessionValidation(request);
  const session = await sessionService.getSession(request);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  await personalInformationService.getPersonalInformationIntoSession(session, request, userInfoToken.sin);

  if (!session.has('newHomeAddress')) {
    instrumentationService.countHttpStatus('home-address.validate.no-session', 302);
    return redirectWithLocale(request, '/');
  }

  const newHomeAddress = session.get('newHomeAddress');
  const countryList = await lookupService.getAllCountries();
  const regionList = await lookupService.getAllRegions();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:home-address.address-accuracy.page-title') }) };

  instrumentationService.countHttpStatus('home-address.validate', 200);
  return json({ countryList, meta, newHomeAddress, regionList });
}

export async function action({ request }: ActionFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request);
  instrumentationService.countHttpStatus('home-address.validate', 302);
  return redirectWithLocale(request, '/personal-information/home-address/confirm');
}

export default function PersonalInformationHomeAddressAccuracy() {
  const { newHomeAddress, countryList, regionList } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:home-address.address-accuracy.subtitle')}</p>
      <Form method="post" noValidate>
        <p className="mb-4">{t('personal-information:home-address.address-accuracy.invalid-address-info')}</p>
        <p>{t('personal-information:home-address.address-accuracy.note')}</p>
        <dl className="my-6 divide-y border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:home-address.address-accuracy.requested-change')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              {newHomeAddress ? (
                <Address
                  address={newHomeAddress.address}
                  city={newHomeAddress.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === newHomeAddress.province)?.abbr}
                  postalZipCode={newHomeAddress.postalCode}
                  country={countryList.find((country) => country.countryId === newHomeAddress.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
            </dd>
          </div>
        </dl>
        <div className="my-4 flex flex-wrap items-center gap-3">
          <Button id="confirm-button" variant="primary">
            {t('personal-information:home-address.address-accuracy.continue')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information/">
            {t('personal-information:home-address.address-accuracy.cancel')}
          </ButtonLink>
          <ButtonLink id="edit-button" to="/personal-information/home-address/edit">
            {t('personal-information:home-address.address-accuracy.re-enter-address')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
