import { redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-benefits';

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
  pageIdentifier: pageIds.protected.profile.dentalBenefits,
  pageTitleI18nKey: 'protected-profile:government-dental-benefits.page-title',
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

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);

  const clientDentalBenefits = clientApplication.dentalBenefits.flatMap(async (id) => {
    const federalProgram = await federalGovernmentInsurancePlanService.findLocalizedFederalGovernmentInsurancePlanById(id, locale);
    if (federalProgram.isSome()) return [federalProgram.unwrap().name];

    const provincialProgram = await provincialGovernmentInsurancePlanService.findLocalizedProvincialGovernmentInsurancePlanById(id, locale);
    if (provincialProgram.isSome()) return [provincialProgram.unwrap().name];

    return [];
  });

  const listAllLocalizedDentalBenefits = await federalGovernmentInsurancePlanService.listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const listAllLocalizedProvincialDentalBenefits = await provincialGovernmentInsurancePlanService.listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);

  const children = clientApplication.children.map((child) => {
    const dentalBenefits = child.dentalBenefits.flatMap((id) => {
      const federal = listAllLocalizedDentalBenefits.find((benefit) => benefit.id === id);
      if (federal) return [federal.name];

      const provincial = listAllLocalizedProvincialDentalBenefits.find((benefit) => benefit.id === id);
      if (provincial) return [provincial.name];

      return [];
    });

    return { ...child, dentalBenefits };
  });

  const meta = { title: t('gcweb:meta.title.template', { title: t('protected-profile:government-dental-benefits.page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  return { meta, clientApplication, clientDentalBenefits, children, SCCH_BASE_URI };
}

export default function ViewGovernmentDentalBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { clientApplication, clientDentalBenefits, children, SCCH_BASE_URI } = loaderData;

  return (
    <div className="max-w-prose">
      <dl className="divide-y border-y py-4">
        <section className="space-y-4">
          <h2 className="font-lato text-2xl font-bold">{`${clientApplication.applicantInformation.firstName} ${clientApplication.applicantInformation.lastName}`}</h2>
          <DescriptionListItem term={t('protected-profile:government-dental-benefits.have-access')}>
            <p>{clientApplication.dentalBenefits.length > 0 ? t('protected-profile:government-dental-benefits.yes') : t('protected-profile:government-dental-benefits.no')}</p>
            <ul className="ml-8 list-disc">
              {clientDentalBenefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
            {/*TODO: Update routeId*/}
            <InlineLink id="update-government-dental-benefits" routeId="protected/profile/government-dental-benefits" params={params}>
              {t('protected-profile:government-dental-benefits.update-link-text')}
            </InlineLink>
          </DescriptionListItem>
        </section>
        {children.length > 0 && (
          <div className="mt-6 space-y-8">
            {children.map((child, index) => {
              const childName = `${child.information.firstName} ${child.information.lastName}`;
              return (
                <>
                  <section key={index} className="space-y-4">
                    <h2 className="font-lato mb-4 text-2xl font-bold">{childName}</h2>
                    <DescriptionListItem term={t('protected-profile:government-dental-benefits.have-access')}>
                      <p>{child.dentalBenefits.length > 0 ? t('protected-profile:government-dental-benefits.yes') : t('protected-profile:government-dental-benefits.no')}</p>
                      <ul className="ml-8 list-disc">
                        {child.dentalBenefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                      {/*TODO: Update routeId*/}
                      <InlineLink id="update-government-dental-benefits" routeId="protected/profile/government-dental-benefits" params={params}>
                        {t('protected-profile:government-dental-benefits.update-link-text')}
                      </InlineLink>
                    </DescriptionListItem>
                  </section>
                </>
              );
            })}
          </div>
        )}
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink variant="primary" id="back-button" to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>
          {t('protected-profile:government-dental-benefits.return-button')}
        </ButtonLink>
      </div>
    </div>
  );
}
