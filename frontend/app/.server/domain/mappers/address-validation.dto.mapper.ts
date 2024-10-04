import { injectable } from 'inversify';

import type { AddressCorrectionResultDto } from '~/.server/domain/dtos';
import type { AddressCorrectionResultEntity } from '~/.server/domain/entities';

export interface AddressValidationDtoMapper {
  mapAddressCorrectionResultEntityToAddressCorrectionResultDto(addressCorrectionResultEntity: AddressCorrectionResultEntity): AddressCorrectionResultDto;
}

@injectable()
export class AddressValidationDtoMapperImpl implements AddressValidationDtoMapper {
  mapAddressCorrectionResultEntityToAddressCorrectionResultDto(addressCorrectionResultEntity: AddressCorrectionResultEntity): AddressCorrectionResultDto {
    const correctionResults = addressCorrectionResultEntity['wsaddr:CorrectionResults'];

    const address = correctionResults['nc:AddressFullText'];
    const city = correctionResults['nc:AddressCityName'];
    const postalCode = correctionResults['nc:AddressPostalCode'];
    const provinceCode = correctionResults['can:ProvinceCode'];
    const status = this.mapStatusCodeToStatus(correctionResults['wsaddr:Information']['wsaddr:StatusCode']);

    return { address, city, postalCode, provinceCode, status };
  }

  protected mapStatusCodeToStatus(statusCode: string) {
    switch (statusCode) {
      case 'Corrected':
        return 'Corrected';
      case 'NotCorrect':
        return 'NotCorrect';
      case 'Valid':
        return 'Valid';
      default:
        throw new Error(`Unknown correction result status: [${statusCode}]`);
    }
  }
}
