import { faCheckCircle, faCircleXmark, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import type { Route } from './+types/eligibility';

import { TYPES } from '~/.server/constants';
import { getFixedT } from '~/.server/utils/locale.utils';
import { ButtonLink } from '~/components/buttons';
import { DescriptionListItem } from '~/components/description-list-item';
import { InlineLink } from '~/components/inline-link';
import { pageIds } from '~/page-ids';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { mergeMeta } from '~/utils/meta-utils';
import type { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('protected-profile', 'gcweb'),
  pageIdentifier: pageIds.protected.profile.eligibility,
  pageTitleI18nKey: 'protected-profile:eligibility.page-title',
} as const satisfies RouteHandleData;

export const meta: Route.MetaFunction = mergeMeta(({ loaderData }) => getTitleMetaTags(loaderData.meta.title));

export async function loader({ context: { appContainer, session }, params, request }: Route.LoaderArgs) {
  const securityHandler = appContainer.get(TYPES.SecurityHandler);
  await securityHandler.validateAuthSession({ request, session });
  const clientApplication = await securityHandler.requireClientApplication({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:eligibility.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  // TODO: fetch proper eligibility criteria from PP when it's ready
  const primaryApplicant = {
    clientId: clientApplication.applicantInformation.clientId,
    firstName: clientApplication.applicantInformation.firstName,
    lastName: clientApplication.applicantInformation.lastName,
    isEligible: true,
    isEnrolled: false,
  };

  const children = clientApplication.children.map((child) => ({
    clientId: child.information.clientId,
    firstName: child.information.firstName,
    lastName: child.information.lastName,
    isEligible: false,
    isEnrolled: false,
  }));

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.eligibility', { userId: idToken.sub });

  const currentDate = new Date();
  const benefitYearStart = currentDate.getFullYear() - (currentDate.getMonth() < 6 ? 1 : 0);

  return {
    meta,
    SCCH_BASE_URI,
    applicants: [primaryApplicant, ...children],
    benefitYearStart,
  };
}

export default function ProtectedProfileEligibility({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { applicants, SCCH_BASE_URI, benefitYearStart } = loaderData;

  return (
    <div className="max-w-prose space-y-10">
      <p>{t('protected-profile:eligibility.details')}</p>
      <section className="space-y-6">
        <h2 className="font-lato text-2xl font-bold">{t('protected-profile:eligibility.current-year')}</h2>
        <p>{t('protected-profile:eligibility.benefit-year-range', { start: benefitYearStart, end: benefitYearStart + 1 })}</p>
        <dl className="divide-y border-y">
          {applicants.map((applicant) => (
            <DescriptionListItem key={applicant.clientId} term={`${applicant.firstName} ${applicant.lastName}`}>
              <p className="flex items-center gap-4">
                {applicant.isEligible ? <FontAwesomeIcon icon={faCheckCircle} className="text-green-700" /> : <FontAwesomeIcon icon={faCircleXmark} className="text-red-700" />}
                {applicant.isEligible ? t('protected-profile:eligibility.eligible') : t('protected-profile:eligibility.not-eligible')}
              </p>
            </DescriptionListItem>
          ))}
        </dl>
      </section>

      <section className="space-y-6">
        <h2 className="font-lato text-2xl font-bold">{t('protected-profile:eligibility.next-year')}</h2>
        <p>{t('protected-profile:eligibility.benefit-year-range', { start: benefitYearStart + 1, end: benefitYearStart + 2 })}</p>
        <dl className="divide-y border-y">
          {applicants.map((applicant) => (
            <DescriptionListItem key={applicant.clientId} term={`${applicant.firstName} ${applicant.lastName}`}>
              <p className="flex items-center gap-4">
                {applicant.isEnrolled ? <FontAwesomeIcon icon={faCheckCircle} className="text-green-700" /> : <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-700" />}
                {applicant.isEnrolled ? t('protected-profile:eligibility.enrolled') : t('protected-profile:eligibility.not-enrolled')}
                {!applicant.isEnrolled && (
                  <InlineLink routeId="protected/apply/index" params={params} className="pl-8">
                    {t('protected-profile:eligibility.apply', { year: benefitYearStart + 2 })}
                  </InlineLink>
                )}
              </p>
            </DescriptionListItem>
          ))}
        </dl>
      </section>

      <ButtonLink
        variant="primary"
        id="back-button"
        to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}
        data-gc-analytics-customclick="ESDC-EDSC:CDCP Applicant Profile-Protected:Return to dashboard - Member eligibility return button click"
      >
        {t('protected-profile:eligibility.return-button')}
      </ButtonLink>
    </div>
  );
}
