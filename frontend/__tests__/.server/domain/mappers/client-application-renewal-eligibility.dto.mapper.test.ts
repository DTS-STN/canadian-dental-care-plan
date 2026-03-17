import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';

import type { ClientApplicationDto, ClientChildDto, ClientEligibilityDto } from '~/.server/domain/dtos';
import { DefaultClientApplicationRenewalEligibilityDtoMapper } from '~/.server/domain/mappers/client-application-renewal-eligibility.dto.mapper';
import type { ClientEligibilityService } from '~/.server/domain/services';
import { isChildOrYouth } from '~/.server/routes/helpers/base-application-route-helpers';
import { isValidCoverageCopayTierCode } from '~/.server/utils/coverage.utils';

vi.mock('~/.server/routes/helpers/base-application-route-helpers');
vi.mock('~/.server/utils/coverage.utils');

const SERVER_CONFIG = {
  ELIGIBILITY_STATUS_CODE_ELIGIBLE: 'eligible',
  ENROLLMENT_STATUS_CODE_ENROLLED: 'enrolled',
};

/** Builds a minimal adult ClientApplicationDto with optional overrides. */
function makeClientApplication(overrides: Partial<ClientApplicationDto> = {}): ClientApplicationDto {
  return {
    applicationYearId: 'year-2024',
    typeOfApplication: 'adult',
    applicantInformation: {
      clientNumber: 'client-001',
      clientId: 'id-001',
      firstName: 'John',
      lastName: 'Doe',
      socialInsuranceNumber: '000-000-000',
    },
    children: [],
    communicationPreferences: {
      preferredLanguage: 'en',
      preferredMethodSunLife: 'email',
      preferredMethodGovernmentOfCanada: 'email',
    },
    contactInformation: {
      copyMailingAddress: false,
      mailingAddress: '123 Main St',
      mailingCity: 'Ottawa',
      mailingCountry: 'CA',
    },
    dateOfBirth: '1980-01-01',
    dentalBenefits: [],
    hasFiledTaxes: true,
    isInvitationToApplyClient: false,
    ...overrides,
  };
}

/** Builds a minimal ClientChildDto. */
function makeChild(clientNumber: string, dateOfBirth = '2015-01-01'): ClientChildDto {
  return {
    dentalBenefits: [],
    dentalInsurance: false,
    information: {
      clientNumber,
      clientId: `id-${clientNumber}`,
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth,
      isParent: false,
      socialInsuranceNumber: '111-111-111',
    },
  };
}

/**
 * Builds a ClientEligibilityDto with sensible defaults for an enrolled, eligible client.
 *
 * `eligibilityStatusCode` uses a key-in-options check so that passing
 * `{ eligibilityStatusCode: undefined }` explicitly produces `undefined` in the returned object
 * rather than falling back to the eligible default.
 */
function makeEligibility(
  clientNumber: string,
  options: {
    enrollmentStatusCode?: string;
    eligibilityStatusCode?: string;
  } = {},
): ClientEligibilityDto {
  const enrollmentStatusCode = options.enrollmentStatusCode ?? SERVER_CONFIG.ENROLLMENT_STATUS_CODE_ENROLLED;
  const eligibilityStatusCode = 'eligibilityStatusCode' in options ? options.eligibilityStatusCode : SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE;

  return {
    clientId: `id-${clientNumber}`,
    clientNumber,
    firstName: 'John',
    lastName: 'Doe',
    eligibilityStatusCode,
    enrollmentStatusCode,
    earnings: [],
  };
}

describe('DefaultClientApplicationRenewalEligibilityDtoMapper', () => {
  let mockClientEligibilityService: MockProxy<ClientEligibilityService>;
  let mapper: DefaultClientApplicationRenewalEligibilityDtoMapper;

  beforeEach(() => {
    // Pin the clock to a fixed date so that age-category calculations in isChildOrYouth
    // (and any other time-sensitive logic) produce deterministic results regardless of
    // when the test suite is actually run.
    vi.useFakeTimers({ now: new Date('2026-04-15') });

    mockClientEligibilityService = mock<ClientEligibilityService>({
      listClientEligibilitiesByClientNumbers: vi.fn(),
    });

    mapper = new DefaultClientApplicationRenewalEligibilityDtoMapper(mockClientEligibilityService, SERVER_CONFIG);

    vi.mocked(isChildOrYouth).mockReturnValue(true);
    vi.mocked(isValidCoverageCopayTierCode).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('mapClientApplicationDtoToClientApplicationRenewalEligibilityDto', () => {
    describe('INELIGIBLE-NO-CLIENT-NUMBERS', () => {
      it('returns INELIGIBLE-NO-CLIENT-NUMBERS for a children application with no children', async () => {
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication({ typeOfApplication: 'children', children: [] }));
        expect(result.result).toBe('INELIGIBLE-NO-CLIENT-NUMBERS');
      });

      it('returns INELIGIBLE-NO-CLIENT-NUMBERS when all children are filtered out by isChildOrYouth', async () => {
        vi.mocked(isChildOrYouth).mockReturnValue(false);
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication({ typeOfApplication: 'children', children: [makeChild('child-001'), makeChild('child-002')] }));
        expect(result.result).toBe('INELIGIBLE-NO-CLIENT-NUMBERS');
      });
    });

    describe('INELIGIBLE-NO-ELIGIBILITIES', () => {
      it('returns INELIGIBLE-NO-ELIGIBILITIES when no eligibilities exist for any client number', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map());
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
        expect(result.result).toBe('INELIGIBLE-NO-ELIGIBILITIES');
      });
    });

    describe('INELIGIBLE-NOT-ENROLLED', () => {
      it('returns INELIGIBLE-NOT-ENROLLED when the client is not enrolled', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { enrollmentStatusCode: 'not-enrolled' })]]));
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled but profile eligibility status is not eligible', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { eligibilityStatusCode: 'not-eligible' })]]));
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled and profile eligibility status is absent (undefined)', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { eligibilityStatusCode: undefined })]]));
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled and profile eligibility status is an empty string', async () => {
        // An empty string is !== undefined but also !== ELIGIBILITY_STATUS_CODE_ELIGIBLE,
        // so the client is skipped in Step 2.
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { eligibilityStatusCode: '' })]]));
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });
    });

    describe('ELIGIBLE', () => {
      it('returns ELIGIBLE when enrolled and profile eligibility status is eligible', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001')]]));
        const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
        expect(result.result).toBe('ELIGIBLE');
      });

      it('throws on an unrecognised typeOfApplication (exhaustive guard)', async () => {
        await expect(
          mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            makeClientApplication({ typeOfApplication: 'unknown' as any }),
          ),
        ).rejects.toThrow("Unexpected typeOfApplication: 'unknown'");
      });

      describe('typeOfApplication: adult', () => {
        it('includes only the applicant client number in eligibleClientNumbers', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001')]]));
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.eligibleClientNumbers).toEqual(['client-001']);
        });
      });

      describe('typeOfApplication: children', () => {
        it('includes only child client numbers in eligibleClientNumbers', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
            new Map([
              ['child-001', makeEligibility('child-001')],
              ['child-002', makeEligibility('child-002')],
            ]),
          );
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication({ typeOfApplication: 'children', children: [makeChild('child-001'), makeChild('child-002')] }));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.eligibleClientNumbers).toEqual(['child-001', 'child-002']);
        });

        it('only includes children that pass the isChildOrYouth age check', async () => {
          vi.mocked(isChildOrYouth).mockImplementation((dob) => dob === '2015-01-01');
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['child-001', makeEligibility('child-001')]]));
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(
            makeClientApplication({
              typeOfApplication: 'children',
              children: [makeChild('child-001', '2015-01-01'), makeChild('child-002', '2006-06-01')],
            }),
          );
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.eligibleClientNumbers).toEqual(['child-001']);
        });
      });

      describe('typeOfApplication: family', () => {
        it('includes the applicant and child client numbers in eligibleClientNumbers', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
            new Map([
              ['client-001', makeEligibility('client-001')],
              ['child-001', makeEligibility('child-001')],
            ]),
          );
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication({ typeOfApplication: 'family', children: [makeChild('child-001')] }));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.eligibleClientNumbers).toEqual(['client-001', 'child-001']);
        });
      });

      describe('inputModel', () => {
        it('returns simplified when the application has a valid coverage copay tier code', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001')]]));
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication({ coverageCopayTierCode: 'tier-1' }));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('simplified');
        });

        it('returns simplified for a family application when the application has a valid coverage copay tier code', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
            new Map([
              ['client-001', makeEligibility('client-001')],
              ['child-001', makeEligibility('child-001')],
            ]),
          );
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication({ typeOfApplication: 'family', children: [makeChild('child-001')], coverageCopayTierCode: 'tier-1' }));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('simplified');
        });

        it('returns full when the application has no coverage copay tier code', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001')]]));
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication());
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('full');
        });

        it('returns full when the application has an unrecognised coverage copay tier code', async () => {
          vi.mocked(isValidCoverageCopayTierCode).mockReturnValue(false);
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001')]]));
          const result = await mapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(makeClientApplication({ coverageCopayTierCode: 'tier-unknown' }));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('full');
        });
      });
    });
  });
});
