import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import pageIds from '../../../page-ids.json';
import { Address } from '~/components/address';
import { Button, ButtonLink } from '~/components/buttons';
import { InputRadios } from '~/components/input-radios';
import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLookupService } from '~/services/lookup-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.suggested.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.suggested.breadcrumbs.suggested-address' },
  ],
  i18nNamespaces: getTypedI18nNamespaces('personal-information', 'gcweb'),
  pageIdentifier: pageIds.protected.personalInformation.homeAddressSuggested,
  pageTitleI18nKey: 'personal-information:home-address.suggested.page-title',
};

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, request }: LoaderFunctionArgs) {
  const instrumentationService = getInstrumentationService();
  const lookupService = getLookupService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const csrfToken = String(session.get('csrfToken'));
  const homeAddressInfo = session.get('newHomeAddress');
  const suggestedAddressInfo = session.get('suggestedAddress');

  const countryList = await lookupService.getAllCountries();
  const regionList = await lookupService.getAllRegions();

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('personal-information:home-address.suggested.page-title') }) };

  instrumentationService.countHttpStatus('home-address.suggest', 200);
  return json({ countryList, csrfToken, homeAddressInfo, meta, regionList, suggestedAddressInfo });
}

export async function action({ context: { session }, request }: ActionFunctionArgs) {
  const log = getLogger('home-address/suggested');

  const instrumentationService = getInstrumentationService();
  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const formData = Object.fromEntries(await request.formData());
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData['_csrf']);

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const useSuggestedAddress = formData.selectedAddress === 'suggested';
  session.set('useSuggestedAddress', useSuggestedAddress);

  instrumentationService.countHttpStatus('home-address.suggest', 302);
  return redirectWithLocale(request, '/personal-information/home-address/confirm');
}

export default function HomeAddressSuggested() {
  const { homeAddressInfo, suggestedAddressInfo, countryList, regionList, csrfToken } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(handle.i18nNamespaces);

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('personal-information:home-address.suggested.subtitle')}</p>
      <Form method="post" noValidate>
        <input type="hidden" name="_csrf" value={csrfToken} />
        <p className="mb-4">{t('personal-information:home-address.suggested.note')}</p>
        <dl className="my-6 divide-y border-y">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:home-address.suggested.address-entered')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              {homeAddressInfo ? (
                <Address
                  address={homeAddressInfo.address}
                  city={homeAddressInfo.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === homeAddressInfo.province)?.abbr}
                  postalZipCode={homeAddressInfo.postalCode}
                  country={countryList.find((country) => country.countryId === homeAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
            </dd>
          </div>
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
            <dt className="font-semibold">{t('personal-information:home-address.suggested.address-suggested')}</dt>
            <dd className="mt-3 sm:col-span-2 sm:mt-0">
              {suggestedAddressInfo ? (
                <Address
                  address={suggestedAddressInfo.address}
                  city={suggestedAddressInfo.city}
                  provinceState={regionList.find((region) => region.provinceTerritoryStateId === suggestedAddressInfo.province)?.abbr}
                  postalZipCode={suggestedAddressInfo.postalCode}
                  country={countryList.find((country) => country.countryId === suggestedAddressInfo.country)?.[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] ?? ' '}
                />
              ) : (
                <p>{t('personal-information:index.no-address-on-file')}</p>
              )}
            </dd>
          </div>
        </dl>
        <div className="my-6">
          <InputRadios
            id="selected-address"
            name="selectedAddress"
            legend={t('personal-information:home-address.suggested.choose-address')}
            options={[
              { value: 'home', children: t('personal-information:home-address.suggested.use-entered') },
              { value: 'suggested', children: t('personal-information:home-address.suggested.use-suggested') },
            ]}
            required
          />
        </div>
        <p className="mb-4">{t('personal-information:home-address.suggested.re-enter-address')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button id="confirm-button" variant="primary">
            {t('personal-information:home-address.suggested.continue')}
          </Button>
          <ButtonLink id="cancel-button" to="/personal-information/">
            {t('personal-information:home-address.suggested.cancel')}
          </ButtonLink>
          <ButtonLink id="edit-button" to="/personal-information/home-address/edit">
            {t('personal-information:home-address.suggested.edit')}
          </ButtonLink>
        </div>
      </Form>
    </>
  );
}
