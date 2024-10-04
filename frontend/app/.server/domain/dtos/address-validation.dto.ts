/**
 * Represents a Data Transfer Object (DTO) for an address correction result.
 */
export type AddressCorrectionResultDto = Readonly<{
  /** The status of the address correction. */
  status: 'Corrected' | 'NotCorrect' | 'Valid';

  /** The full or partial address. */
  address: string;

  /** The name of the city. */
  city: string;

  /** The 6-character postal code. */
  postalCode: string;

  /** The 2-character Canadian province or territorial code. */
  provinceCode: string;
}>;
