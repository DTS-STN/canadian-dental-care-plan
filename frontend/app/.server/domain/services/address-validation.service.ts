import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { AddressCorrectionResultDto } from '~/.server/domain/dtos';
import type { AddressValidationDtoMapper } from '~/.server/domain/mappers';
import type { AddressValidationRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface AddressCorrectionRequest {
  /** The full or partial address. */
  address: string;

  /** The name of the city. */
  city: string;

  /** The 6-character postal code. */
  postalCode: string;

  /** The 2-character Canadian province or territorial code. */
  provinceCode: string;
}

export interface AddressValidationService {
  /**
   * Corrects the provided address using the data passed in the `AddressCorrectionRequest` object.
   *
   * @param addressCorrectionRequest The request object containing the address details that need to be corrected
   * @returns A promise that resolves to a `AddressCorrectionResultDto` object containing corrected address results
   */
  getAddressCorrectionResult(addressCorrectionRequest: AddressCorrectionRequest): Promise<AddressCorrectionResultDto>;
}

@injectable()
export class AddressValidationServiceImpl implements AddressValidationService {
  private readonly log: Logger;

  constructor(
    @inject(SERVICE_IDENTIFIER.LOG_FACTORY) logFactory: LogFactory,
    @inject(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_DTO_MAPPER) private readonly addressValidationDtoMapper: AddressValidationDtoMapper,
    @inject(SERVICE_IDENTIFIER.ADDRESS_VALIDATION_REPOSITORY) private readonly addressValidationRepository: AddressValidationRepository,
  ) {
    this.log = logFactory.createLogger('AddressValidationServiceImpl');
  }

  async getAddressCorrectionResult(addressCorrectionRequest: AddressCorrectionRequest): Promise<AddressCorrectionResultDto> {
    this.log.trace('Getting address correction results with addressCorrectionRequest: [%j]', addressCorrectionRequest);
    const addressCorrectionResultEntity = await this.addressValidationRepository.getAddressCorrectionResult(addressCorrectionRequest);
    const addressCorrectionResultDto = this.addressValidationDtoMapper.mapAddressCorrectionResultEntityToAddressCorrectionResultDto(addressCorrectionResultEntity);
    this.log.trace('Returning address correction result: [%j]', addressCorrectionResultDto);
    return addressCorrectionResultDto;
  }
}
