import { describe, expect, it } from 'vitest';

import type { UpdateAddressRequestDto, UpdateCommunicationPreferenceRequestDto, UpdateDentalBenefitsRequestDto, UpdateEmailAddressRequestDto, UpdatePhoneNumbersRequestDto } from '~/.server/domain/dtos';
import type { UpdateAddressRequestEntity, UpdateCommunicationPreferenceRequestEntity, UpdateDentalBenefitsRequestEntity, UpdateEmailAddressRequestEntity, UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';
import { DefaultProfileDtoMapper } from '~/.server/domain/mappers';

const mapper = new DefaultProfileDtoMapper();

describe('mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity', () => {
  it('should map UpdateDentalBenefitsRequestDto to UpdateDentalBenefitsRequestEntity', () => {
    const mockDentalBenefitsEntity: UpdateDentalBenefitsRequestEntity = {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            ApplicantDetail: {
              InsurancePlan: [
                {
                  InsurancePlanFederalIdentification: { IdentificationID: 'FEDERAL-PLAN-001' },
                  InsurancePlanProvincialIdentification: { IdentificationID: 'PROVINCIAL-PLAN-002' },
                },
              ],
            },
          },
          ClientIdentification: [
            {
              IdentificationID: '123456789',
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
        },
      },
    };
    const expectedDentalBenefitsDto: UpdateDentalBenefitsRequestDto = {
      clientId: '123456789',
      hasFederalBenefits: true,
      federalSocialProgram: 'FEDERAL-PLAN-001',
      hasProvincialTerritorialBenefits: true,
      provincialTerritorialSocialProgram: 'PROVINCIAL-PLAN-002',
      province: 'ON',
    };
    const result = mapper.mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(expectedDentalBenefitsDto);
    expect(result).toEqual(mockDentalBenefitsEntity);
  });

  it('should default to zero UUIDs if no benefits are selected', () => {
    const expectedEntity: UpdateDentalBenefitsRequestEntity = {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            ApplicantDetail: {
              InsurancePlan: [
                {
                  InsurancePlanFederalIdentification: {
                    IdentificationID: '00000000-0000-0000-0000-000000000000',
                  },
                  InsurancePlanProvincialIdentification: {
                    IdentificationID: '00000000-0000-0000-0000-000000000000',
                  },
                },
              ],
            },
          },
          ClientIdentification: [
            {
              IdentificationID: '123456789',
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
        },
      },
    };

    const dto: UpdateDentalBenefitsRequestDto = {
      clientId: '123456789',
      hasFederalBenefits: false,
      hasProvincialTerritorialBenefits: false,
      province: 'ON',
    };

    const result = mapper.mapUpdateDentalBenefitsRequestDtoToUpdateDentalBenefitsRequestEntity(dto);
    expect(result).toEqual(expectedEntity);
  });
});

describe('mapUpdateEmailAddressRequestDtoToUpdateEmailAddressRequestEntity', () => {
  it('should map UpdateEmailAddressRequestDto to UpdateEmailAddressRequestEntity', () => {
    const mockEmailAddressEntity: UpdateEmailAddressRequestEntity = {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            ApplicantEmailVerifiedIndicator: true,
          },
          ClientIdentification: [
            {
              IdentificationID: '123456789',
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              EmailAddress: [
                {
                  EmailAddressID: 'user@example.com',
                },
              ],
            },
          ],
        },
      },
    };
    const expectedEmailAddressDto: UpdateEmailAddressRequestDto = {
      clientId: '123456789',
      email: 'user@example.com',
    };
    const result = mapper.mapUpdateEmailAddressRequestDtoToUpdateEmailAddressRequestEntity(expectedEmailAddressDto);
    expect(result).toEqual(mockEmailAddressEntity);
  });
});

describe('mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity', () => {
  it('should map UpdatePhoneNumbersRequestDto to UpdatePhoneNumbersRequestEntity', () => {
    const mockPhoneNumbersEntity: UpdatePhoneNumbersRequestEntity = {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: '123456789',
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              TelephoneNumber: [
                {
                  TelephoneNumberCategoryCode: {
                    ReferenceDataID: '555-555-1234',
                    ReferenceDataName: 'Primary',
                  },
                },
                {
                  TelephoneNumberCategoryCode: {
                    ReferenceDataID: '555-555-5678',
                    ReferenceDataName: 'Alternate',
                  },
                },
              ],
            },
          ],
        },
      },
    };
    const expectedPhoneNumbersDto: UpdatePhoneNumbersRequestDto = {
      clientId: '123456789',
      phoneNumber: '555-555-1234',
      phoneNumberAlt: '555-555-5678',
    };
    const result = mapper.mapUpdatePhoneNumbersRequestDtoToUpdatePhoneNumbersRequestEntity(expectedPhoneNumbersDto);
    expect(result).toEqual(mockPhoneNumbersEntity);
  });
});

describe('mapUpdateAddressRequestDtoToUpdateAddressRequestEntity', () => {
  it('should map UpdateAddressRequestDto to UpdateAddressRequestEntity', () => {
    const mockAddressEntity: UpdateAddressRequestEntity = {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: '123456789',
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressCategoryCode: {
                    ReferenceDataName: 'Mailing',
                  },
                  AddressCityName: 'Mailing City',
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'USA',
                    },
                  },
                  AddressPostalCode: '90210',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: 'LA',
                    },
                  },
                  AddressSecondaryUnitText: '',
                  AddressStreet: {
                    StreetName: '298 Fake Street',
                  },
                },
                {
                  AddressCategoryCode: {
                    ReferenceDataName: 'Home',
                  },
                  AddressCityName: 'Home City',
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'CAN',
                    },
                  },
                  AddressPostalCode: 'H0H 0H0',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: 'ON',
                    },
                  },
                  AddressSecondaryUnitText: '',
                  AddressStreet: {
                    StreetName: '123 Fake Street',
                  },
                },
              ],
            },
          ],
        },
      },
    };
    const expectedAddressDto: UpdateAddressRequestDto = {
      clientId: '123456789',
      mailingAddress: {
        address: '298 Fake Street',
        apartment: '',
        city: 'Mailing City',
        country: 'USA',
        postalCode: '90210',
        province: 'LA',
      },
      homeAddress: {
        address: '123 Fake Street',
        apartment: '',
        city: 'Home City',
        country: 'CAN',
        postalCode: 'H0H 0H0',
        province: 'ON',
      },
    };
    const result = mapper.mapUpdateAddressRequestDtoToUpdateAddressRequestEntity(expectedAddressDto);
    expect(result).toEqual(mockAddressEntity);
  });

  it('should default AddressProvinces to zero UUIDs if no provinces are selected', () => {
    const mockAddressEntity: UpdateAddressRequestEntity = {
      BenefitApplication: {
        Applicant: {
          ClientIdentification: [
            {
              IdentificationID: '123456789',
              IdentificationCategoryText: 'Guid Primary Key',
            },
          ],
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressCategoryCode: {
                    ReferenceDataName: 'Mailing',
                  },
                  AddressCityName: 'Mailing City',
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'USA',
                    },
                  },
                  AddressPostalCode: '90210',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: '00000000-0000-0000-0000-000000000000',
                    },
                  },
                  AddressSecondaryUnitText: '',
                  AddressStreet: {
                    StreetName: '298 Fake Street',
                  },
                },
                {
                  AddressCategoryCode: {
                    ReferenceDataName: 'Home',
                  },
                  AddressCityName: 'Home City',
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'CAN',
                    },
                  },
                  AddressPostalCode: 'H0H 0H0',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: '00000000-0000-0000-0000-000000000000',
                    },
                  },
                  AddressSecondaryUnitText: '',
                  AddressStreet: {
                    StreetName: '123 Fake Street',
                  },
                },
              ],
            },
          ],
        },
      },
    };
    const expectedAddressDto: UpdateAddressRequestDto = {
      clientId: '123456789',
      mailingAddress: {
        address: '298 Fake Street',
        apartment: '',
        city: 'Mailing City',
        country: 'USA',
        postalCode: '90210',
        province: undefined,
      },
      homeAddress: {
        address: '123 Fake Street',
        apartment: '',
        city: 'Home City',
        country: 'CAN',
        postalCode: 'H0H 0H0',
        province: undefined,
      },
    };
    const result = mapper.mapUpdateAddressRequestDtoToUpdateAddressRequestEntity(expectedAddressDto);
    expect(result).toEqual(mockAddressEntity);
  });
});

describe('mapUpdateCommunicationPreferenceRequestDtoToUpdateCommunicationPreferenceRequestEntity', () => {
  it('should map UpdateCommunicationPreferenceRequestDto to UpdateCommunicationPreferenceRequestEntity', () => {
    const mockCommunicationPreferenceEntity: UpdateCommunicationPreferenceRequestEntity = {
      BenefitApplication: {
        Applicant: {
          PersonLanguage: [
            {
              CommunicationCategoryCode: {
                ReferenceDataID: 'fr',
              },
              PreferredIndicator: true,
            },
          ],
          PreferredMethodCommunicationCode: {
            ReferenceDataID: 'mail',
          },
          PreferredMethodCommunicationGCCode: {
            ReferenceDataID: 'email',
          },
        },
      },
    };
    const expectedCommunicationPreferenceDto: UpdateCommunicationPreferenceRequestDto = {
      clientId: '123456789',
      preferredLanguage: 'fr',
      preferredMethodSunLife: 'mail',
      preferredMethodGovernmentOfCanada: 'email',
    };
    const result = mapper.mapUpdateCommunicationPreferenceRequestDtoToUpdateCommunicationPreferenceRequestEntity(expectedCommunicationPreferenceDto);
    expect(result).toEqual(mockCommunicationPreferenceEntity);
  });
});
