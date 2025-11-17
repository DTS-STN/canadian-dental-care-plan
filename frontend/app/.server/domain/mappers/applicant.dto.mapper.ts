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
    return {
      clientId: Result.from(applicantResponseEntity.BenefitApplication.Applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client ID')?.IdentificationID).expect('Expected clientId to be defined'),
      clientNumber: Result.from(applicantResponseEntity.BenefitApplication.Applicant.ClientIdentification.find((id) => id.IdentificationCategoryText === 'Client Number')?.IdentificationID).expect('Expected clientNumber to be defined'),
      dateOfBirth: applicantResponseEntity.BenefitApplication.Applicant.PersonBirthDate.date,
      firstName: Result.from(applicantResponseEntity.BenefitApplication.PersonName.at(0)?.PersonGivenName.at(0)).expect('Expected applicantResponseEntity.BenefitApplication.PersonName[0].PersonGivenName[0] to be defined'),
      lastName: Result.from(applicantResponseEntity.BenefitApplication.PersonName.at(0)?.PersonSurName).expect('Expected applicantResponseEntity.BenefitApplication.PersonName[0].PersonSurName to be defined'),
      socialInsuranceNumber: applicantResponseEntity.BenefitApplication.PersonSINIdentification.IdentificationID,
    };
  }
}
