import { injectable } from 'inversify';
import { Result } from 'oxide.ts';

import type { ApplicantDto } from '~/.server/domain/dtos';
import type { ApplicantRequestEntity, ApplicantResponseEntity } from '~/.server/domain/entities';

export interface ApplicantDtoMapper {
  mapSinToApplicantRequestEntity(sin: string): ApplicantRequestEntity;
  mapApplicantResponseEntityToApplicantDto(applicantResponseEntity: ApplicantResponseEntity): ApplicantDto;
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

  mapApplicantResponseEntityToApplicantDto(applicantResponseEntity: ApplicantResponseEntity): ApplicantDto {
    const applicant = applicantResponseEntity.BenefitApplication.Applicant;
    return {
      clientId: Result.from(applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID).expect('Expected clientId to be defined'),
      clientNumber: Result.from(applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID).expect('Expected clientNumber to be defined'),
      dateOfBirth: applicant.PersonBirthDate.date,
      firstName: Result.from(applicant.PersonName.at(0)?.PersonGivenName.at(0)).expect('Expected applicant.PersonName[0].PersonGivenName[0] to be defined'),
      lastName: Result.from(applicant.PersonName.at(0)?.PersonSurName).expect('Expected applicant.PersonName[0].PersonSurName to be defined'),
      socialInsuranceNumber: applicant.PersonSINIdentification.IdentificationID,
    };
  }
}
