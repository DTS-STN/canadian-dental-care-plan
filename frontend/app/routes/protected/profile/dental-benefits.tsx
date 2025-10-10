import { useTranslation } from 'react-i18next';

import type { Route } from './+types/dental-benefits';

import { TYPES } from '~/.server/constants';
import { getFixedT, getLocale } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.dentalBenefits,
  pageTitleI18nKey: 'protected-profile:dental-benefits.page-title',
};

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const locale = getLocale(request);

  const federalGovernmentInsurancePlanService = appContainer.get(TYPES.FederalGovernmentInsurancePlanService);
  const provincialGovernmentInsurancePlanService = appContainer.get(TYPES.ProvincialGovernmentInsurancePlanService);
  const listAllLocalizedDentalBenefits = await federalGovernmentInsurancePlanService.listAndSortLocalizedFederalGovernmentInsurancePlans(locale);
  const listAllLocalizedProvincialDentalBenefits = await provincialGovernmentInsurancePlanService.listAndSortLocalizedProvincialGovernmentInsurancePlans(locale);

  const clientDentalBenefits = clientApplication.dentalBenefits.flatMap((id) => {
    const federalBenefit = listAllLocalizedDentalBenefits.find((benefit) => benefit.id === id);
    if (federalBenefit) return [federalBenefit.name];

    const provincialBenefit = listAllLocalizedProvincialDentalBenefits.find((benefit) => benefit.id === id);
    if (provincialBenefit) return [provincialBenefit.name];

    return [];
  });

  const children = clientApplication.children.map((child) => {
    const dentalBenefits = child.dentalBenefits.flatMap((id) => {
      const federalBenefit = listAllLocalizedDentalBenefits.find((benefit) => benefit.id === id);
      if (federalBenefit) return [federalBenefit.name];

      const provincialBenefit = listAllLocalizedProvincialDentalBenefits.find((benefit) => benefit.id === id);
      if (provincialBenefit) return [provincialBenefit.name];

      return [];
    });

    return { ...child, dentalBenefits };
  });

  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:dental-benefits.page-title') }) };

  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.dental-benefits', { userId: idToken.sub });

  return { meta, clientApplication, clientDentalBenefits, children, SCCH_BASE_URI };
}

export default function ViewGovernmentDentalBenefits({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { clientApplication, clientDentalBenefits, children, SCCH_BASE_URI } = loaderData;

  return (
    <div className="max-w-prose space-y-10">
      <p className="mb-4">{t('protected-profile:dental-benefits.access-to-dental')}</p>
      <p className="mb-4">{t('protected-profile:dental-benefits.eligibility-criteria')}</p>
      <section className="space-y-6">
        <h2 className="font-lato text-2xl font-bold">{`${clientApplication.applicantInformation.firstName} ${clientApplication.applicantInformation.lastName}`}</h2>
        <dl className="divide-y border-y">
          <DescriptionListItem term={t('protected-profile:dental-benefits.have-access')}>
            <div className="space-y-4">
              <p>{clientApplication.dentalBenefits.length > 0 ? t('protected-profile:dental-benefits.yes') : t('protected-profile:dental-benefits.no')}</p>
              {clientApplication.dentalBenefits.length > 0 && (
                <ul className="list-disc space-y-2 pl-10">
                  {clientDentalBenefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 sm:mt-6">
              <InlineLink routeId="protected/profile/dental-benefits/edit" params={params}>
                {t('protected-profile:dental-benefits.update-link-text')}
              </InlineLink>
            </div>
          </DescriptionListItem>
        </dl>
      </section>

      {children.map((child) => {
        const childParams = { ...params, childId: child.information.clientId };
        const childName = `${child.information.firstName} ${child.information.lastName}`;
        return (
          <section className="space-y-6" key={child.information.clientId}>
            <h2 className="font-lato text-2xl font-bold">{childName}</h2>
            <dl className="divide-y border-y">
              <DescriptionListItem term={t('protected-profile:dental-benefits.have-access')}>
                <div className="space-y-4">
                  <p>{child.dentalBenefits.length > 0 ? t('protected-profile:dental-benefits.yes') : t('protected-profile:dental-benefits.no')}</p>
                  {child.dentalBenefits.length > 0 && (
                    <ul className="list-disc space-y-2 pl-10">
                      {child.dentalBenefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-4 sm:mt-6">
                  <InlineLink routeId="protected/profile/dental-benefits/:childId/edit" params={childParams}>
                    {t('protected-profile:dental-benefits.update-link-text')}
                  </InlineLink>
                </div>
              </DescriptionListItem>
            </dl>
          </section>
        );
      })}

      <ButtonLink
        variant="primary"
        id="back-button"
        to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Return to dashboard - Other government dental benefits return button click"
      >
        {t('protected-profile:dental-benefits.return-button')}
      </ButtonLink>
    </div>
  );
}
