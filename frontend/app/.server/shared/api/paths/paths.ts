import type { ApplicantPath } from '~/.server/shared/api/paths/applicant.path';
import type { BenefitApplicationPath } from '~/.server/shared/api/paths/benefit-application.path';
import type { RetrieveBenefitApplicationConfigDatesPath } from '~/.server/shared/api/paths/retrieve-benefit-application-config-dates.path';
import type { RetrieveBenefitApplicationPath } from '~/.server/shared/api/paths/retrieve-benefit-application.path';

export type Paths = {
  '/applicant': ApplicantPath;
  '/benefit-application': BenefitApplicationPath;
  '/retrieve-benefit-application': RetrieveBenefitApplicationPath;
  '/retrieve-benefit-application-config-dates': RetrieveBenefitApplicationConfigDatesPath;
};
