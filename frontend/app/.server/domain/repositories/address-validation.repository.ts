import type { AddressCorrectionRequestEntity, AddressCorrectionResultEntity } from '~/.server/domain/entities';

export interface AddressValidationRepository {
  /**
   * Corrects the provided address using the data passed in the `AddressCorrectionRequest` object.
   *
   * @param addressCorrectionRequestEntity The request entity object containing the address details that need to be corrected
   * @returns A promise that resolves to a `AddressCorrectionResultEntity` object containing corrected address results
   */
  getAddressCorrectionResult(addressCorrectionRequestEntity: AddressCorrectionRequestEntity): Promise<AddressCorrectionResultEntity>;
}
