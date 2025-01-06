import { injectable } from 'inversify';

import type { ApplicantRequestEntity, ApplicantResponseEntity } from '~/.server/domain/entities';

export interface ApplicantDtoMapper {
  mapSinToApplicantRequestEntity(sin: string): ApplicantRequestEntity;
  mapApplicantResponseEntityToClientNumber(applicantResponseEntity: ApplicantResponseEntity): string | null;
}

@injectable()
export class DefaultApplicantDtoMapper implements ApplicantDtoMapper {
  mapSinToApplicantRequestEntity(sin: string): ApplicantRequestEntity {
    return {
      Applicant: {
        PersonSINIdentification: {
          IdentificationID: sin,
        },
      },
    };
  }

  mapApplicantResponseEntityToClientNumber(applicantResponseEntity: ApplicantResponseEntity): string | null {
    const clientNumber = applicantResponseEntity.BenefitApplication?.Applicant?.ClientIdentification?.find(({ IdentificationCategoryText }) => IdentificationCategoryText === 'Client Number')?.IdentificationID;
    return clientNumber ?? null;
  }
}
