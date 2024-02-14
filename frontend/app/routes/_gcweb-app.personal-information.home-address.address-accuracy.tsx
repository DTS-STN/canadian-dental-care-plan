import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { cn } from '~/utils/tw-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.address-accuracy.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.address-accuracy.page-title' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0013',
  pageTitleI18nKey: 'personal-information:home-address.address-accuracy.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  if (!session.has('newHomeAddress')) return redirect('/');
  const newHomeAddress = await session.get('newHomeAddress');
  return json({ newHomeAddress });
}

export async function action({ request }: ActionFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);
  return redirect('/personal-information/home-address/confirm');
}

export default function PersonalInformationHomeAddressAccuracy() {
  const { newHomeAddress } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <p>{t('personal-information:home-address.address-accuracy.subtitle')}</p>
      <Form method="post">
        <section className="alert alert-warning mt-4">
          <h2>{t('personal-information:home-address.address-accuracy.invalid-address')}</h2>
          <p>{t('personal-information:home-address.address-accuracy.invalid-address-info')}</p>
        </section>
        <p>{t('personal-information:home-address.address-accuracy.note')}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="panel panel-info flex flex-col">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className={cn('glyphicon', 'glyphicon-map-marker', 'pull-right')} aria-hidden="true"></span>
                {t('personal-information:home-address.address-accuracy.requested-change')}
              </h2>
            </header>
            <div className="panel-body">
              <Address address={newHomeAddress?.address} city={newHomeAddress?.city} provinceState={newHomeAddress?.province} postalZipCode={newHomeAddress?.postalCode} country={newHomeAddress?.country} />
            </div>
          </section>
        </div>
        <Link id="cancel-button" to="/personal-information/home-address/edit" className="text-base font-bold">
          {t('personal-information:home-address.address-accuracy.re-enter-address')}
        </Link>
        <div className="my-4 flex flex-wrap gap-3">
          <button id="confirm-button" className="btn btn-primary btn-lg">
            {t('personal-information:home-address.address-accuracy.continue')}
          </button>
          <Link id="cancel-button" to="/personal-information/" className="btn btn-default btn-lg">
            {t('personal-information:home-address.address-accuracy.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
