import { inject, injectable } from 'inversify';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { AddressCorrectionRequestDto, AddressCorrectionResultDto } from '~/.server/domain/dtos';
import type { AddressValidationDtoMapper } from '~/.server/domain/mappers';
import type { AddressValidationRepository } from '~/.server/domain/repositories';
import type { LogFactory, Logger } from '~/.server/factories';

export interface AddressValidationService {
  /**
   * Corrects the provided address using the data passed in the `AddressCorrectionRequest` object.
   *
   * @param addressCorrectionRequestDto The request DTO object containing the address details that need to be corrected
   * @returns A promise that resolves to a `AddressCorrectionResultDto` object containing corrected address results
   */
  getAddressCorrectionResult(addressCorrectionRequestDto: AddressCorrectionRequestDto): Promise<AddressCorrectionResultDto>;
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

  async getAddressCorrectionResult(addressCorrectionRequestDto: AddressCorrectionRequestDto): Promise<AddressCorrectionResultDto> {
    this.log.trace('Getting address correction results with addressCorrectionRequest: [%j]', addressCorrectionRequestDto);
    const addressCorrectionResultEntity = await this.addressValidationRepository.getAddressCorrectionResult(addressCorrectionRequestDto);
    const addressCorrectionResultDto = this.addressValidationDtoMapper.mapAddressCorrectionResultEntityToAddressCorrectionResultDto(addressCorrectionResultEntity);
    this.log.trace('Returning address correction result: [%j]', addressCorrectionResultDto);
    return addressCorrectionResultDto;
  }
}
