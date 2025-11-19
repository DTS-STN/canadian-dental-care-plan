import { useParams } from 'react-router';

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
import { useClientEnv } from '~/root';
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

  const primaryApplicantEligibility = eligibilityMap.get(clientApplication.applicantInformation.clientNumber);
  const primaryApplicant = {
    clientId: clientApplication.applicantInformation.clientId,
    clientNumber: clientApplication.applicantInformation.clientNumber,
    firstName: clientApplication.applicantInformation.firstName,
    lastName: clientApplication.applicantInformation.lastName,
    earnings: primaryApplicantEligibility?.earnings ?? [],
    statusCode: primaryApplicantEligibility?.statusCode,
    statusCodeNextYear: primaryApplicantEligibility?.statusCodeNextYear,
  };

  const children = clientApplication.children.map((child) => {
    const childEligibility = eligibilityMap.get(child.information.clientNumber);
    return {
      clientId: child.information.clientId,
      clientNumber: child.information.clientNumber,
      firstName: child.information.firstName,
      lastName: child.information.lastName,
      earnings: childEligibility?.earnings ?? [],
      statusCode: childEligibility?.statusCode,
      statusCodeNextYear: childEligibility?.statusCodeNextYear,
    };
  });

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

export default function ProtectedProfileEligibility({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { applicants, SCCH_BASE_URI, currentCoverage } = loaderData;
  const { ELIGIBLE_STATUS_CODE_ELIGIBLE } = useClientEnv();

  return (
    <div className="max-w-prose space-y-10">
      <p>{t('protected-profile:eligibility.details')}</p>
      <section className="space-y-6">
        <h2 className="font-lato text-2xl font-bold">{t('protected-profile:eligibility.current-year')}</h2>
        <p>{t('protected-profile:eligibility.current-year-details', { end: currentCoverage.endYear })}</p>
        <dl className="divide-y border-y">
          {applicants.map((applicant) => {
            const eligibilityStatus = getEligibilityStatus({ applicant, taxationYear: currentCoverage.taxationYear, isNextYear: false, ELIGIBLE_STATUS_CODE_ELIGIBLE });
            return (
              <DescriptionListItem key={applicant.clientId} term={`${applicant.firstName} ${applicant.lastName}`}>
                <EligibilityStatusIndicator status={eligibilityStatus} coverageStartYear={currentCoverage.startYear} coverageEndYear={currentCoverage.endYear} />
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
            const taxationYear = currentCoverage.taxationYear + 1;
            const coverageStartYear = currentCoverage.startYear + 1;
            const coverageEndYear = currentCoverage.endYear + 1;
            const eligibilityStatus = getEligibilityStatus({ applicant, taxationYear, isNextYear: true, ELIGIBLE_STATUS_CODE_ELIGIBLE });
            return (
              <DescriptionListItem key={applicant.clientId} term={`${applicant.firstName} ${applicant.lastName}`}>
                <EligibilityStatusIndicator status={eligibilityStatus} coverageStartYear={coverageStartYear} coverageEndYear={coverageEndYear} showApplyLink={true} />
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

type EligibilityStatus = 'eligible' | 'not-eligible' | 'not-enrolled';
interface GetEligibilityStatusParams {
  applicant: Route.ComponentProps['loaderData']['applicants'][number];
  taxationYear: number;
  isNextYear: boolean;
  ELIGIBLE_STATUS_CODE_ELIGIBLE: string;
}

function getEligibilityStatus({ applicant, taxationYear, isNextYear, ELIGIBLE_STATUS_CODE_ELIGIBLE }: GetEligibilityStatusParams): EligibilityStatus {
  const statusCode = isNextYear ? applicant.statusCodeNextYear : applicant.statusCode;

  // Applicant profile eligibility status codes take precedence over earnings
  if (statusCode) {
    return statusCode === ELIGIBLE_STATUS_CODE_ELIGIBLE ? 'eligible' : 'not-eligible';
  }

  // Fallback to earnings if no status code is present
  const earning = applicant.earnings.find((earning) => earning.taxationYear === taxationYear);
  if (!earning) return 'not-enrolled';
  return earning.isEligible ? 'eligible' : 'not-eligible';
}

interface EligibilityStatusIndicatorProps {
  status: EligibilityStatus;
  coverageStartYear: number;
  coverageEndYear: number;
  showApplyLink?: boolean;
}

export function EligibilityStatusIndicator({ status, coverageStartYear, coverageEndYear, showApplyLink }: EligibilityStatusIndicatorProps) {
  const { t } = useTranslation(handle.i18nNamespaces);
  const params = useParams();

  if (status === 'eligible') {
    return (
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faCheckCircle} className="text-green-700" />
        <span className="text-nowrap">{t('protected-profile:eligibility.eligible')}</span>
      </div>
    );
  }

  if (status === 'not-eligible') {
    return (
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faCircleXmark} className="text-red-700" />
        <span className="text-nowrap">{t('protected-profile:eligibility.not-eligible')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:gap-6">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-700" />
        <span className="text-nowrap">{t('protected-profile:eligibility.not-enrolled')}</span>
      </div>
      {showApplyLink && (
        <InlineLink routeId="protected/apply/index" params={params}>
          {t('protected-profile:eligibility.apply', { start: coverageStartYear, end: coverageEndYear })}
        </InlineLink>
      )}
    </div>
  );
}
