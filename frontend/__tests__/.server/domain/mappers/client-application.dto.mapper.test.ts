import { describe, expect, it } from 'vitest';

import type { ClientApplicationEntity } from '~/.server/domain/entities';
import { ClientApplicationDtoMapperImpl } from '~/.server/domain/mappers';

describe('ClientApplicationDtoMapperImpl', () => {
  it('should map ClientApplicationEntity to ClientApplicationDto correctly', () => {
    // Arrange
    const clientApplicationEntity: ClientApplicationEntity = {
      BenefitApplication: {
        Applicant: {
          ApplicantDetail: {
            PrivateDentalInsuranceIndicator: true,
            InsurancePlan: [
              {
                InsurancePlanIdentification: [{ IdentificationID: '12345' }],
              },
            ],
            ConsentToSharePersonalInformationIndicator: false,
            AttestParentOrGuardianIndicator: true,
          },
          PersonBirthDate: { date: '2000-01-01' },
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressCategoryCode: { ReferenceDataName: 'Home' },
                  AddressCityName: 'Toronto',
                  AddressCountry: { CountryCode: { ReferenceDataID: 'CA', ReferenceDataName: 'Canada' } },
                  AddressPostalCode: 'M5A 1A1',
                  AddressProvince: { ProvinceCode: { ReferenceDataID: 'ON', ReferenceDataName: 'Ontario' } },
                  AddressSecondaryUnitText: 'Apt 100',
                  AddressStreet: { StreetName: '123 Main St' },
                },
              ],
              EmailAddress: [{ EmailAddressID: 'example@example.com' }],
              TelephoneNumber: [{ TelephoneNumberCategoryCode: { ReferenceDataID: '1', ReferenceDataName: 'Mobile' } }],
            },
          ],
          PersonLanguage: [
            {
              CommunicationCategoryCode: { ReferenceDataID: 'EN', ReferenceDataName: 'English' },
              PreferredIndicator: true,
            },
          ],
          PersonMaritalStatus: {
            StatusCode: { ReferenceDataID: 'S', ReferenceDataName: 'Single' },
          },
          PersonName: [{ PersonGivenName: ['John'], PersonSurName: 'Doe' }],
          PersonSINIdentification: { IdentificationID: '987654321' },
          RelatedPerson: [],
          MailingSameAsHomeIndicator: false,
          PreferredMethodCommunicationCode: { ReferenceDataID: 'EMAIL', ReferenceDataName: 'Email' },
        },
        BenefitApplicationCategoryCode: { ReferenceDataID: '1', ReferenceDataName: 'General' },
        BenefitApplicationChannelCode: { ReferenceDataID: 'WEB', ReferenceDataName: 'Web' },
      },
    };

    const mapper = new ClientApplicationDtoMapperImpl();

    // Act
    const result = mapper.mapClientApplicationEntityToClientApplicationDto(clientApplicationEntity);

    // Assert
    expect(result).toEqual(clientApplicationEntity);
  });
});
