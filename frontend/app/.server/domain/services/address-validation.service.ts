import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { AddressCorrectionRequestDto, AddressCorrectionResultDto } from '~/.server/domain/dtos';
import type { AddressValidationDtoMapper } from '~/.server/domain/mappers';
import type { AddressValidationRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
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
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.domain.mappers.AddressValidationDtoMapper) private readonly addressValidationDtoMapper: AddressValidationDtoMapper,
    @inject(TYPES.domain.repositories.AddressValidationRepository) private readonly addressValidationRepository: AddressValidationRepository,
    @inject(TYPES.domain.services.AuditService) private readonly auditService: AuditService,
  ) {
    this.log = logFactory.createLogger('AddressValidationServiceImpl');
  }

  async getAddressCorrectionResult(addressCorrectionRequestDto: AddressCorrectionRequestDto): Promise<AddressCorrectionResultDto> {
    this.log.trace('Getting address correction results with addressCorrectionRequest: [%j]', addressCorrectionRequestDto);

    this.auditService.createAudit('address-validation.get-address-correction-result', { userId: addressCorrectionRequestDto.userId });

    const addressCorrectionResultEntity = await this.addressValidationRepository.getAddressCorrectionResult(addressCorrectionRequestDto);
    const addressCorrectionResultDto = this.addressValidationDtoMapper.mapAddressCorrectionResultEntityToAddressCorrectionResultDto(addressCorrectionResultEntity);

    this.log.trace('Returning address correction result: [%j]', addressCorrectionResultDto);
    return addressCorrectionResultDto;
  }
}
