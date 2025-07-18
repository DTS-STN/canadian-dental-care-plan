import { injectable } from 'inversify';
import { None, Some } from 'oxide.ts';
import type { Option } from 'oxide.ts';

import type { ApplicationStatusBasicInfoRequestDto, ApplicationStatusSinRequestDto } from '~/.server/domain/dtos';
import type { ApplicationStatusBasicInfoRequestEntity, ApplicationStatusEntity, ApplicationStatusSinRequestEntity } from '~/.server/domain/entities';

export interface ApplicationStatusDtoMapper {
  mapApplicationStatusEntityToApplicationStatusId(applicationStatusEntity: ApplicationStatusEntity): Option<string>;
  mapApplicationStatusBasicInfoRequestDtoToApplicationStatusBasicInfoRequestEntity(ApplicationStatusBasicInfoRequestDto: ApplicationStatusBasicInfoRequestDto): ApplicationStatusBasicInfoRequestEntity;
  mapApplicationStatusSinRequestDtoToApplicationStatusSinRequestEntity(ApplicationStatusSinRequestDto: ApplicationStatusSinRequestDto): ApplicationStatusSinRequestEntity;
}

@injectable()
export class DefaultApplicationStatusDtoMapper implements ApplicationStatusDtoMapper {
  mapApplicationStatusEntityToApplicationStatusId(applicationStatusEntity: ApplicationStatusEntity): Option<string> {
    const applicationStatusId = applicationStatusEntity.BenefitApplication.BenefitApplicationStatus[0].ReferenceDataID;
    return applicationStatusId ? Some(applicationStatusId) : None;
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
