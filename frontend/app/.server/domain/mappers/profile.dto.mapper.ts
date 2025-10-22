import { injectable } from 'inversify';

import type { UpdatePhoneNumbersRequestDto } from '~/.server/domain/dtos';
import type { UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';

export interface ProfileDtoMapper {
  mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(updatePhoneNumbersRequestDto: UpdatePhoneNumbersRequestDto): UpdatePhoneNumbersRequestEntity;
}

@injectable()
export class DefaultProfileDtoMapper implements ProfileDtoMapper {
  mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(updatePhoneNumbersRequestDto: UpdatePhoneNumbersRequestDto): UpdatePhoneNumbersRequestEntity {
    return {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: updatePhoneNumbersRequestDto.clientId,
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              TelephoneNumber: [
                {
                  TelephoneNumberCategoryCode: {
                    ReferenceDataID: updatePhoneNumbersRequestDto.phoneNumber ?? '',
                    ReferenceDataName: 'Primary',
                  },
                },
                {
                  TelephoneNumberCategoryCode: {
                    ReferenceDataID: updatePhoneNumbersRequestDto.phoneNumberAlt ?? '',
                    ReferenceDataName: 'Alternate',
                  },
                },
              ],
            },
          ],
        },
      },
    };
  }
}
