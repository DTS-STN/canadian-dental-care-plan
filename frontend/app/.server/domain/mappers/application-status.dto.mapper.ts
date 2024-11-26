import { injectable } from 'inversify';

import type { ApplicationStatusBasicInfoRequestDto, ApplicationStatusSinRequestDto } from '~/.server/domain/dtos';
import type { ApplicationStatusBasicInfoRequestEntity, ApplicationStatusEntity, ApplicationStatusSinRequestEntity } from '~/.server/domain/entities';

export interface ApplicationStatusDtoMapper {
  mapApplicationStatusEntityToApplicationStatusId(applicationStatusEntity: ApplicationStatusEntity): string | null;
  mapApplicationStatusBasicInfoRequestDtoToApplicationStatusBasicInfoRequestEntity(ApplicationStatusBasicInfoRequestDto: ApplicationStatusBasicInfoRequestDto): ApplicationStatusBasicInfoRequestEntity;
  mapApplicationStatusSinRequestDtoToApplicationStatusSinRequestEntity(ApplicationStatusSinRequestDto: ApplicationStatusSinRequestDto): ApplicationStatusSinRequestEntity;
}

@injectable()
export class DefaultApplicationStatusDtoMapper implements ApplicationStatusDtoMapper {
  mapApplicationStatusEntityToApplicationStatusId(applicationStatusEntity: ApplicationStatusEntity): string | null {
    return applicationStatusEntity.BenefitApplication.BenefitApplicationStatus[0].ReferenceDataID ?? null;
  }

  mapApplicationStatusBasicInfoRequestDtoToApplicationStatusBasicInfoRequestEntity(applicationStatusBasicInfoRequestDto: ApplicationStatusBasicInfoRequestDto): ApplicationStatusBasicInfoRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          PersonName: [
            {
              PersonGivenName: [applicationStatusBasicInfoRequestDto.firstName],
              PersonSurName: applicationStatusBasicInfoRequestDto.lastName,
            },
          ],
          PersonBirthDate: {
            date: applicationStatusBasicInfoRequestDto.dateOfBirth,
          },
          ClientIdentification: [
            {
              IdentificationID: applicationStatusBasicInfoRequestDto.applicationCode,
            },
          ],
        },
      },
    };
  }

  mapApplicationStatusSinRequestDtoToApplicationStatusSinRequestEntity(applicationStatusSinRequestDto: ApplicationStatusSinRequestDto): ApplicationStatusSinRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          PersonSINIdentification: {
            IdentificationID: applicationStatusSinRequestDto.sin,
          },
          ClientIdentification: [
            {
              IdentificationID: applicationStatusSinRequestDto.applicationCode,
            },
          ],
        },
      },
    };
  }
}
