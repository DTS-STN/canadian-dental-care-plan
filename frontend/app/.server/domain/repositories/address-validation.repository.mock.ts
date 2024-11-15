import { fakerEN_CA as faker } from '@faker-js/faker';
import { inject, injectable } from 'inversify';

import { AddressCorrectionStatus } from '../dtos';
import { AddressValidationRepository } from './address-validation.repository';
import { TYPES } from '~/.server/constants';
import type { AddressCorrectionRequestEntity, AddressCorrectionResultEntity } from '~/.server/domain/entities';
import type { LogFactory, Logger } from '~/.server/factories';

@injectable()
export class MockAddressValidationRepository implements AddressValidationRepository {
  private readonly log: Logger;

  constructor(@inject(TYPES.factories.LogFactory) logFactory: LogFactory) {
    this.log = logFactory.createLogger('MockAddressValidationRepository');
  }

  getAddressCorrectionResult(addressCorrectionRequestEntity: AddressCorrectionRequestEntity): Promise<AddressCorrectionResultEntity> {
    this.log.debug('Checking correctness of address for addressCorrectionRequest: [%j]', addressCorrectionRequestEntity);

    const addressCorrectionResults: AddressCorrectionResultEntity = {
      'wsaddr:CorrectionResults': {
        'nc:AddressFullText': faker.location.streetAddress(true).toUpperCase(),
        'nc:AddressCityName': addressCorrectionRequestEntity.city.toUpperCase(),
        'can:ProvinceCode': addressCorrectionRequestEntity.provinceCode.toUpperCase(),
        'nc:AddressPostalCode': addressCorrectionRequestEntity.postalCode.toUpperCase(),
        'wsaddr:Information': {
          'wsaddr:StatusCode': faker.helpers.arrayElement<AddressCorrectionStatus>(['Corrected', 'NotCorrect', 'Valid']),
        },
      },
    };

    this.log.debug('Address correction results: [%j]', addressCorrectionResults);
    return Promise.resolve(addressCorrectionResults);
  }
}
