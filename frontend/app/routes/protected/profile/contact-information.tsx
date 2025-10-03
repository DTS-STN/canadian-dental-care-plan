import { redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/contact-information';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getCurrentDateString } from '~/utils/date-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.contactInformation,
  pageTitleI18nKey: 'protected-profile:contact-information.page-title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const userInfoToken = session.get('userInfoToken');
  invariant(userInfoToken.sin, 'Expected userInfoToken.sin to be defined');

  const currentDate = getCurrentDateString(locale);
  const applicationYearService = appContainer.get(TYPES.ApplicationYearService);
  const applicationYear = applicationYearService.getRenewalApplicationYear(currentDate);

  const clientApplicationService = appContainer.get(TYPES.ClientApplicationService);
  const clientApplicationResult = await clientApplicationService.findClientApplicationBySin({ sin: userInfoToken.sin, applicationYearId: applicationYear.applicationYearId, userId: userInfoToken.sub });

  if (clientApplicationResult.isNone()) {
    throw redirect(getPathById('protected/data-unavailable', params));
  }

  const clientApplication = clientApplicationResult.unwrap();

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:contact-information.page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  return {
    meta,
    phoneNumber: clientApplication.contactInformation.phoneNumber,
    altPhoneNumber: clientApplication.contactInformation.phoneNumberAlt,
    emailAddress: clientApplication.contactInformation.email,
    mailingAddress: clientApplication.contactInformation.mailingAddress,
    homeAddress: clientApplication.contactInformation.homeAddress,
    SCCH_BASE_URI,
  };
}

export default function ViewContactInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { phoneNumber, altPhoneNumber, emailAddress, mailingAddress, homeAddress, SCCH_BASE_URI } = loaderData;

  return (
    <div className="max-w-prose">
      <section className="space-y-6">
        <dl>
          <DescriptionListItem term={t('protected-profile:contact-information.phone-number')}>
            <p>{phoneNumber}</p>
          </DescriptionListItem>
          <DescriptionListItem term={t('protected-profile:contact-information.alt-phone-number')}>
            <p>{altPhoneNumber}</p>
          </DescriptionListItem>
        </dl>
        <InlineLink id="update-contact-information-phone" routeId="protected/profile/contact-information/edit-phone" params={params}>
          {t('protected-profile:contact-information.update-phone-link-text')}
        </InlineLink>
      </section>
      <section className="space-y-6">
        <dl>
          <DescriptionListItem term={t('protected-profile:contact-information.email')}>
            <p>{emailAddress}</p>
          </DescriptionListItem>
        </dl>
        <InlineLink id="update-contact-information-email" routeId="protected/profile/contact-information/edit-email" params={params}>
          {t('protected-profile:contact-information.update-email-link-text')}
        </InlineLink>
      </section>
      <section className="space-y-6">
        <dl>
          <DescriptionListItem term={t('protected-profile:contact-information.mailing-address')}>
            <p>{mailingAddress}</p>
          </DescriptionListItem>
        </dl>
        <InlineLink id="update-contact-information-mailing-address" routeId="protected/profile/contact-information/edit-mailing-address" params={params}>
          {t('protected-profile:contact-information.update-mailing-address-link-text')}
        </InlineLink>
      </section>
      <section className="space-y-6">
        <dl>
          <DescriptionListItem term={t('protected-profile:contact-information.home-address')}>
            <p>{homeAddress}</p>
          </DescriptionListItem>
        </dl>
        <InlineLink id="update-contact-information-home-address" routeId="protected/profile/contact-information/edit-home-address" params={params}>
          {t('protected-profile:contact-information.update-home-address-link-text')}
        </InlineLink>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink variant="primary" id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>
          {t('protected-profile:contact-information.return-button')}
        </ButtonLink>
      </div>
    </div>
  );
}
