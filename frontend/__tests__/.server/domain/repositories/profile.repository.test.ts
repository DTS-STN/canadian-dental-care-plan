import { Response } from 'undici';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import type { ServerConfig } from '~/.server/configs';
import type { UpdateCommunicationPreferenceRequestEntity, UpdatePhoneNumbersRequestEntity } from '~/.server/domain/entities';
import { DefaultProfileRepository } from '~/.server/domain/repositories/profile.repository';
import type { HttpClient } from '~/.server/http';

describe('DefaultProfileRepository', () => {
  let serverConfigMock: Pick<ServerConfig, 'INTEROP_API_BASE_URI' | 'HTTP_PROXY_URL' | 'INTEROP_API_MAX_RETRIES' | 'INTEROP_API_BACKOFF_MS' | 'INTEROP_API_SUBSCRIPTION_KEY'>;

  beforeEach(() => {
    serverConfigMock = {
      INTEROP_API_BASE_URI: 'https://api.example.com',
      HTTP_PROXY_URL: 'http://proxy.example.com',
      INTEROP_API_MAX_RETRIES: 3,
      INTEROP_API_BACKOFF_MS: 100,
      INTEROP_API_SUBSCRIPTION_KEY: 'SUBSCRIPTION_KEY',
    };
  });

  describe('updateCommunicationPreferences', () => {
    it('should succeed when API returns 200', async () => {
      const httpClientMock = mock<HttpClient>();
      httpClientMock.instrumentedFetch.mockResolvedValue(new Response(null, { status: 200 }));

      const repository = new DefaultProfileRepository(serverConfigMock, httpClientMock);

      const entity: UpdateCommunicationPreferenceRequestEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [
              {
                IdentificationID: '123456789',
                IdentificationCategoryText: 'Guid Primary Key',
              },
            ],
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

      await expect(repository.updateCommunicationPreferences(entity)).resolves.toBeUndefined();

      expect(httpClientMock.instrumentedFetch).toHaveBeenCalledExactlyOnceWith(
        'http.client.interop-api.update-benefit-application.communication-preferences.posts',
        'https://api.example.com/dental-care/applicant-information/dts/v1/update-benefit-application',
        expect.objectContaining({
          proxyUrl: serverConfigMock.HTTP_PROXY_URL,
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': serverConfigMock.INTEROP_API_SUBSCRIPTION_KEY,
          }),
          body: JSON.stringify(entity),
        }),
      );
    });

    it('should throw Error when API returns non-200', async () => {
      const httpClientMock = mock<HttpClient>();
      httpClientMock.instrumentedFetch.mockResolvedValue(new Response('error', { status: 500, statusText: 'Internal Server Error' }));

      const repository = new DefaultProfileRepository(serverConfigMock, httpClientMock);

      const entity: UpdateCommunicationPreferenceRequestEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [
              {
                IdentificationID: '123456789',
                IdentificationCategoryText: 'Guid Primary Key',
              },
            ],
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

      await expect(repository.updateCommunicationPreferences(entity)).rejects.toThrow("Failed to 'POST' for update benefit application communication preferences. Status: 500, Status Text: Internal Server Error");
    });
  });

  describe('updatePhoneNumbers', () => {
    it('should succeed when API returns 200', async () => {
      const httpClientMock = mock<HttpClient>();
      httpClientMock.instrumentedFetch.mockResolvedValue(new Response(null, { status: 200 }));

      const repository = new DefaultProfileRepository(serverConfigMock, httpClientMock);

      const entity: UpdatePhoneNumbersRequestEntity = {
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

      await expect(repository.updatePhoneNumbers(entity)).resolves.toBeUndefined();

      expect(httpClientMock.instrumentedFetch).toHaveBeenCalledExactlyOnceWith(
        'http.client.interop-api.update-benefit-application.phone-numbers.posts',
        'https://api.example.com/dental-care/applicant-information/dts/v1/update-benefit-application',
        expect.objectContaining({
          proxyUrl: serverConfigMock.HTTP_PROXY_URL,
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': serverConfigMock.INTEROP_API_SUBSCRIPTION_KEY,
          }),
          body: JSON.stringify(entity),
        }),
      );
    });
    it('should throw Error when API returns non-200', async () => {
      const httpClientMock = mock<HttpClient>();
      httpClientMock.instrumentedFetch.mockResolvedValue(new Response('error', { status: 500, statusText: 'Internal Server Error' }));

      const repository = new DefaultProfileRepository(serverConfigMock, httpClientMock);
      const entity: UpdatePhoneNumbersRequestEntity = {
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

      await expect(repository.updatePhoneNumbers(entity)).rejects.toThrow("Failed to 'POST' for update benefit application phone numbers. Status: 500, Status Text: Internal Server Error");
    });
  });

  //   describe('updateEmailAddress', () => {
  //     it('should succeed when API returns 200', async () => {
  //       const httpClientMock = mock<HttpClient>();
  //       httpClientMock.instrumentedFetch.mockResolvedValue(new Response(null, { status: 200 }));

  //       const repository = new DefaultProfileRepository(serverConfigMock, httpClientMock);

  //       const entity: UpdateEmailAddressRequestEntity = {
  //         BenefitApplication: {
  //           Applicant: {
  //             ClientIdentification: [
  //               {
  //                 IdentificationID: '123456789',
  //                 IdentificationCategoryText: 'Guid Primary Key',
  //               },
  //             ],
  //             PersonContactInformation: [
  //               {
  //                 EmailAddress: [
  //                   {
  //                     EmailAddressID: 'email@example.com',
  //                   },
  //                 ],
  //               },
  //             ],
  //           },
  //         },
  //       };

  //       await expect(repository.updateEmailAddress(entity)).resolves.toBeUndefined();

  //       expect(httpClientMock.instrumentedFetch).toHaveBeenCalledExactlyOnceWith(
  //         'http.client.interop-api.update-benefit-application.email-address.posts',
  //         'https://api.example.com/dental-care/applicant-information/dts/v1/update-benefit-application',
  //         expect.objectContaining({
  //           proxyUrl: serverConfigMock.HTTP_PROXY_URL,
  //           method: 'POST',
  //           headers: expect.objectContaining({
  //             'Content-Type': 'application/json',
  //             'Ocp-Apim-Subscription-Key': serverConfigMock.INTEROP_API_SUBSCRIPTION_KEY,
  //           }),
  //           body: JSON.stringify(entity),
  //         }),
  //       );
  //     });
  //     it('should throw Error when API returns non-200', async () => {
  //       const httpClientMock = mock<HttpClient>();
  //       httpClientMock.instrumentedFetch.mockResolvedValue(new Response('error', { status: 500, statusText: 'Internal Server Error' }));

  //       const repository = new DefaultProfileRepository(serverConfigMock, httpClientMock);
  //       const entity: UpdateEmailAddressRequestEntity = {
  //         BenefitApplication: {
  //           Applicant: {
  //             ClientIdentification: [
  //               {
  //                 IdentificationID: '123456789',
  //                 IdentificationCategoryText: 'Guid Primary Key',
  //               },
  //             ],
  //             PersonContactInformation: [
  //               {
  //                 EmailAddress: [
  //                   {
  //                     EmailAddressID: 'email@example.com',
  //                   },
  //                 ],
  //               },
  //             ],
  //           },
  //         },
  //       };

  //       await expect(repository.updateEmailAddress(entity)).rejects.toThrow("Failed to 'POST' for update benefit application email address. Status: 500, Status Text: Internal Server Error");
  //     });
  //   });
  // - updateDentalBenefits
  // - updateAddresses
});
