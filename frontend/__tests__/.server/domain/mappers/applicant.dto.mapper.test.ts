import { describe, expect, it } from 'vitest';

import type { ApplicantResponseEntity } from '~/.server/domain/entities';
import { DefaultApplicantDtoMapper } from '~/.server/domain/mappers/applicant.dto.mapper';

describe('DefaultApplicantDtoMapper', () => {
  describe('mapApplicantResponseEntityToApplicantDto', () => {
    const mapper = new DefaultApplicantDtoMapper();

    it('should successfully map valid ApplicantResponseEntity to ApplicantDto', () => {
      const mockEntity: ApplicantResponseEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [
              { IdentificationCategoryText: 'Client ID', IdentificationID: '12345' },
              { IdentificationCategoryText: 'Client Number', IdentificationID: '67890' },
            ],
            PersonBirthDate: { date: '1990-01-01' },
            PersonName: [
              {
                PersonGivenName: ['John'],
                PersonSurName: 'Doe',
              },
            ],
            PersonSINIdentification: { IdentificationID: '123456789' },
          },
        },
      };

      const result = mapper.mapApplicantResponseEntityToApplicantDto(mockEntity);

      expect(result).toEqual({
        clientId: '12345',
        clientNumber: '67890',
        dateOfBirth: '1990-01-01',
        firstName: 'John',
        lastName: 'Doe',
        socialInsuranceNumber: '123456789',
      });
    });

    it('should throw error when clientId is not found', () => {
      const mockEntity: ApplicantResponseEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [{ IdentificationCategoryText: 'Client Number', IdentificationID: '67890' }],
            PersonBirthDate: { date: '1990-01-01' },
            PersonName: [{ PersonGivenName: ['John'], PersonSurName: 'Doe' }],
            PersonSINIdentification: { IdentificationID: '123456789' },
          },
        },
      };

      expect(() => mapper.mapApplicantResponseEntityToApplicantDto(mockEntity)).toThrow('Expected clientId to be defined');
    });

    it('should throw error when clientNumber is not found', () => {
      const mockEntity: ApplicantResponseEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [{ IdentificationCategoryText: 'Client ID', IdentificationID: '12345' }],
            PersonBirthDate: { date: '1990-01-01' },
            PersonName: [{ PersonGivenName: ['John'], PersonSurName: 'Doe' }],
            PersonSINIdentification: { IdentificationID: '123456789' },
          },
        },
      };

      expect(() => mapper.mapApplicantResponseEntityToApplicantDto(mockEntity)).toThrow('Expected clientNumber to be defined');
    });

    it('should throw error when firstName is not defined', () => {
      const mockEntity: ApplicantResponseEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [
              { IdentificationCategoryText: 'Client ID', IdentificationID: '12345' },
              { IdentificationCategoryText: 'Client Number', IdentificationID: '67890' },
            ],
            PersonBirthDate: { date: '1990-01-01' },
            PersonName: [{ PersonGivenName: [], PersonSurName: 'Doe' }],
            PersonSINIdentification: { IdentificationID: '123456789' },
          },
        },
      };

      expect(() => mapper.mapApplicantResponseEntityToApplicantDto(mockEntity)).toThrow('Expected applicant.PersonName[0].PersonGivenName[0] to be defined');
    });

    it('should throw error when lastName is not defined', () => {
      const mockEntity: ApplicantResponseEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [
              { IdentificationCategoryText: 'Client ID', IdentificationID: '12345' },
              { IdentificationCategoryText: 'Client Number', IdentificationID: '67890' },
            ],
            PersonBirthDate: { date: '1990-01-01' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            PersonName: [{ PersonGivenName: ['John'], PersonSurName: undefined as any }],
            PersonSINIdentification: { IdentificationID: '123456789' },
          },
        },
      };

      expect(() => mapper.mapApplicantResponseEntityToApplicantDto(mockEntity)).toThrow('Expected applicant.PersonName[0].PersonSurName to be defined');
    });

    it('should throw error when PersonName array is empty', () => {
      const mockEntity: ApplicantResponseEntity = {
        BenefitApplication: {
          Applicant: {
            ClientIdentification: [
              { IdentificationCategoryText: 'Client ID', IdentificationID: '12345' },
              { IdentificationCategoryText: 'Client Number', IdentificationID: '67890' },
            ],
            PersonBirthDate: { date: '1990-01-01' },
            PersonName: [],
            PersonSINIdentification: { IdentificationID: '123456789' },
          },
        },
      };

      expect(() => mapper.mapApplicantResponseEntityToApplicantDto(mockEntity)).toThrow();
    });
  });
});
