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

  const clientNumber = clientApplication.applicantInformation.clientNumber;
  const dependentClientNumbers = clientApplication.children.map((child) => child.information.clientNumber);
  const clientNumbers = [clientNumber, ...dependentClientNumbers];

  const clientEligibilityRequestDto = clientNumbers.map((clientNumber) => ({ clientNumber }));

  const clientEligibilityResponse = await appContainer.get(TYPES.ClientEligibilityService).listClientEligibilitiesByClientNumbers(clientEligibilityRequestDto);

  const eligibilityMap = new Map(clientEligibilityResponse.map((eligibility) => [eligibility.clientNumber, eligibility]));

  const primaryApplicant = {
    clientId: clientApplication.applicantInformation.clientId,
    clientNumber: clientApplication.applicantInformation.clientNumber,
    firstName: clientApplication.applicantInformation.firstName,
    lastName: clientApplication.applicantInformation.lastName,
    earnings: clientApplication.applicantInformation.clientNumber ? (eligibilityMap.get(clientApplication.applicantInformation.clientNumber)?.earnings ?? []) : [],
  };

  const children = clientApplication.children.map((child) => ({
    clientId: child.information.clientId,
    clientNumber: child.information.clientNumber,
    firstName: child.information.firstName,
    lastName: child.information.lastName,
    earnings: child.information.clientNumber ? (eligibilityMap.get(child.information.clientNumber)?.earnings ?? []) : [],
  }));

  const applicants = [primaryApplicant, ...children];

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.msca-template', { title: t('protected-profile:eligibility.page-title') }) };
  const { SCCH_BASE_URI } = appContainer.get(TYPES.ClientConfig);

  const idToken = session.get('idToken');
  appContainer.get(TYPES.AuditService).createAudit('page-view.profile.eligibility', { userId: idToken.sub });

  const currentCoverage = appContainer.get(TYPES.CoverageService).getCurrentCoverage();

  return {
    meta,
    SCCH_BASE_URI,
    applicants,
    currentCoverage,
  };
}

function getEligibilityStatus(earnings: Route.ComponentProps['loaderData']['applicants'][number]['earnings'], taxationYear: number): 'eligible' | 'not-eligible' | 'not-enrolled' {
  const earning = earnings.find((earning) => earning.taxationYear === taxationYear);
  if (!earning) return 'not-enrolled';
  return earning.isEligible ? 'eligible' : 'not-eligible';
}

export default function ProtectedProfileEligibility({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { applicants, SCCH_BASE_URI, currentCoverage } = loaderData;

  return (
    <div className="max-w-prose space-y-10">
      <p>{t('protected-profile:eligibility.details')}</p>
      <section className="space-y-6">
        <h2 className="font-lato text-2xl font-bold">{t('protected-profile:eligibility.current-year')}</h2>
        <p>{t('protected-profile:eligibility.current-year-details', { end: currentCoverage.endYear })}</p>
        <dl className="divide-y border-y">
          {applicants.map((applicant) => {
            const eligibilityStatus = getEligibilityStatus(applicant.earnings, currentCoverage.taxationYear);
            return (
              <DescriptionListItem key={applicant.clientId} term={`${applicant.firstName} ${applicant.lastName}`}>
                <p className="flex items-center gap-4">
                  {eligibilityStatus === 'not-enrolled' && (
                    <>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-700" />
                      <span>{t('protected-profile:eligibility.not-enrolled')}</span>
                    </>
                  )}
                  {eligibilityStatus === 'eligible' && (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-700" />
                      <span>{t('protected-profile:eligibility.eligible')}</span>
                    </>
                  )}
                  {eligibilityStatus === 'not-eligible' && (
                    <>
                      <FontAwesomeIcon icon={faCircleXmark} className="text-red-700" />
                      <span>{t('protected-profile:eligibility.not-eligible')}</span>
                    </>
                  )}
                </p>
              </DescriptionListItem>
            );
          })}
        </dl>
      </section>

      <section className="space-y-6">
        <h2 className="font-lato text-2xl font-bold">{t('protected-profile:eligibility.next-year')}</h2>
        <p>{t('protected-profile:eligibility.benefit-year-range', { start: currentCoverage.startYear + 1, end: currentCoverage.endYear + 1 })}</p>
        <dl className="divide-y border-y">
          {applicants.map((applicant) => {
            const eligibilityStatus = getEligibilityStatus(applicant.earnings, currentCoverage.taxationYear + 1);
            return (
              <DescriptionListItem key={applicant.clientId} term={`${applicant.firstName} ${applicant.lastName}`}>
                <p className="flex items-center gap-4">
                  {eligibilityStatus === 'not-enrolled' && (
                    <>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-700" />
                      <span>{t('protected-profile:eligibility.not-enrolled')}</span>
                      <InlineLink routeId="protected/apply/index" params={params} className="pl-8">
                        {t('protected-profile:eligibility.apply', { year: currentCoverage.endYear + 1 })}
                      </InlineLink>
                    </>
                  )}
                  {eligibilityStatus === 'eligible' && (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-700" />
                      <span>{t('protected-profile:eligibility.eligible')}</span>
                    </>
                  )}
                  {eligibilityStatus === 'not-eligible' && (
                    <>
                      <FontAwesomeIcon icon={faCircleXmark} className="text-red-700" />
                      <span>{t('protected-profile:eligibility.not-eligible')}</span>
                    </>
                  )}
                </p>
              </DescriptionListItem>
            );
          })}
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
