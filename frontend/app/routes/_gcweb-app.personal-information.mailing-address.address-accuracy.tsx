import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { getSessionService } from '~/services/session-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    { labelI18nKey: 'personal-information:mailing-address.address-accuracy.breadcrumbs.home', to: '/' },
    { labelI18nKey: 'personal-information:mailing-address.address-accuracy.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:mailing-address.address-accuracy.page-title' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0014',
  pageTitleI18nKey: 'personal-information:mailing-address.address-accuracy.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  if (!session.has('newMailingAddress')) return redirect('/');
  const newMailingAddress = await session.get('newMailingAddress');
  return json({ newMailingAddress });
}

export async function action({ request }: ActionFunctionArgs) {
  return redirect('/personal-information/mailing-address/confirm');
}

export default function PersonalInformationMailingAddressAccuracy() {
  const { newMailingAddress } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);
  return (
    <>
      <Form method="post">
        <section className="alert alert-warning mt-4">
          <h2>{t('personal-information:mailing-address.address-accuracy.invalid-address')}</h2>
          <p>{t('personal-information:mailing-address.address-accuracy.invalid-address-info')}</p>
        </section>
        <p>{t('personal-information:mailing-address.address-accuracy.note')}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="panel panel-info !m-0 flex flex-col">
            <header className="panel-heading">
              <h2 className="h3 panel-title">
                <span className={clsx('glyphicon', 'glyphicon-map-marker', 'pull-right')} aria-hidden="true"></span>
                {t('personal-information:mailing-address.address-accuracy.requested-change')}
              </h2>
            </header>
            <div className="panel-body">
              <Address address={newMailingAddress?.address} city={newMailingAddress?.city} provinceState={newMailingAddress?.province} postalZipCode={newMailingAddress?.postalCode} country={newMailingAddress?.country} />
            </div>
          </section>
        </div>
        <Link id="cancel-button" to="/personal-information/mailing-address/edit" className="text-base font-bold">
          {t('personal-information:mailing-address.address-accuracy.re-enter-address')}
        </Link>
        <div className="flex flex-wrap gap-3">
          <button id="confirm-button" className="btn btn-primary btn-lg">
            {t('personal-information:mailing-address.address-accuracy.continue')}
          </button>
          <Link id="cancel-button" to="/personal-information/" className="btn btn-default btn-lg">
            {t('personal-information:mailing-address.address-accuracy.cancel')}
          </Link>
        </div>
      </Form>
    </>
  );
}
