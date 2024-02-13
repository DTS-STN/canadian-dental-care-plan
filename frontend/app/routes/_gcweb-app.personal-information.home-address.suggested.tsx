import type { ReactNode } from 'react';

import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { InputRadios } from '~/components/input-radios';
import { getAddressService } from '~/services/address-service.server';
import { getSessionService } from '~/services/session-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [
    // prettier-ignore
    { labelI18nKey: 'personal-information:home-address.suggested.breadcrumbs.personal-information', to: '/personal-information' },
    { labelI18nKey: 'personal-information:home-address.suggested.breadcrumbs.suggested-address' },
  ],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0008',
  pageTitleI18nKey: 'personal-information:home-address.suggested.page-title',
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userService = getUserService();
  const sessionService = await getSessionService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');
  //
  // TODO
  // CHANGE THE SOURCE OF THE SUGGESTED ADDRESS TO WHAT WS ADDRESS SERVICE IS RETURNING INSTEAD OF MAILING ADDRESS
  //
  const suggestedAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const session = await sessionService.getSession(request);
  session.set('homeAddress', homeAddressInfo);
  session.set('suggestedAddress', suggestedAddressInfo);

  return json({ homeAddressInfo, suggestedAddressInfo });
}

export async function action({ request }: ActionFunctionArgs) {
  const userService = getUserService();
  const sessionService = await getSessionService();
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);
  const homeAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.homeAddress ?? '');
  //
  // TODO
  // CHANGE THE SOURCE OF THE SUGGESTED ADDRESS TO WHAT WS ADDRESS SERVICE IS RETURNING INSTEAD OF MAILING ADDRESS
  //
  const suggestedAddressInfo = await getAddressService().getAddressInfo(userId, userInfo?.mailingAddress ?? '');
  const formDataRadio = Object.fromEntries(await request.formData());
  //retrieve selected address, store it in the session and then redirect to the confirm page...
  const session = await sessionService.getSession(request);
  if (formDataRadio.selectedAddress === 'home') {
    session.set('newHomeAddress', homeAddressInfo);
  } else {
    session.set('newHomeAddress', suggestedAddressInfo);
  }
  return redirect('/personal-information/home-address/confirm', {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  });
}

export default function HomeAddressSuggested() {
  const { homeAddressInfo, suggestedAddressInfo } = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNamespaces);

  return (
    <>
      <p>{t('personal-information:home-address.suggested.subtitle')}</p>
      <Form method="post">
        <p>{t('personal-information:home-address.suggested.note')}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <PersonalInformationSection title={t('personal-information:home-address.suggested.address-entered')} icon="glyphicon-map-marker">
            {homeAddressInfo && <Address address={homeAddressInfo?.address} city={homeAddressInfo?.city} provinceState={homeAddressInfo?.province} postalZipCode={homeAddressInfo?.postalCode} country={homeAddressInfo?.country} />}
            {!homeAddressInfo && <p>{t('personal-information:index.no-address-on-file')}</p>}
          </PersonalInformationSection>
          <PersonalInformationSection title={t('personal-information:home-address.suggested.address-suggested')} icon="glyphicon-map-marker">
            {suggestedAddressInfo ? (
              <Address address={suggestedAddressInfo?.address} city={suggestedAddressInfo?.city} provinceState={suggestedAddressInfo?.province} postalZipCode={suggestedAddressInfo?.postalCode} country={suggestedAddressInfo?.country} />
            ) : (
              <p>{t('personal-information:index.no-address-on-file')}</p>
            )}
          </PersonalInformationSection>
        </div>
        <div>
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
        <p>{t('personal-information:home-address.suggested.re-enter-address')}</p>
        <div className="flex flex-wrap gap-3">
          <button id="confirm-button" className="btn btn-primary btn-lg">
            {t('personal-information:home-address.suggested.continue')}
          </button>
          <Link id="cancel-button" to="/personal-information/" className="btn btn-default btn-lg">
            {t('personal-information:home-address.suggested.cancel')}
          </Link>
          <Link id="edit-button" to="/personal-information/home-address/edit" className="btn btn-default btn-lg">
            {t('personal-information:home-address.suggested.edit')}
          </Link>
        </div>
      </Form>
    </>
  );
}

interface PersonalInformationSectionProps {
  children: ReactNode;
  footer?: ReactNode;
  title: ReactNode;
  icon?: string;
}

function PersonalInformationSection({ children, footer, title, icon }: PersonalInformationSectionProps) {
  return (
    <section className="panel panel-info !m-0 flex flex-col">
      <header className="panel-heading">
        <h2 className="h3 panel-title">
          {icon && <span className={clsx('glyphicon', icon, 'pull-right')} aria-hidden="true"></span>}
          {title}
        </h2>
      </header>
      <div className="panel-body">{children}</div>
      {footer && <footer className="panel-footer mt-auto">{footer}</footer>}
    </section>
  );
}
