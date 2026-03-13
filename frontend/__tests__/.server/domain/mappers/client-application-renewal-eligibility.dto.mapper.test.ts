import { None, Some } from 'oxide.ts';
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
 * Pass `missingTierCode: true` to omit `coverageCopayTierTpcCode` (i.e. set it to `undefined`).
 */
function makeEligibility(
  clientNumber: string,
  options: {
    enrollmentStatusCode?: string;
    eligibilityStatusCode?: string;
    earningEligibilityStatusCode?: string;
    coverageCopayTierTpcCode?: string;
    missingTierCode?: boolean;
    applicationYearId?: string;
  } = {},
): ClientEligibilityDto {
  const {
    enrollmentStatusCode = SERVER_CONFIG.ENROLLMENT_STATUS_CODE_ENROLLED,
    eligibilityStatusCode,
    earningEligibilityStatusCode = SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE,
    coverageCopayTierTpcCode = 'tier-1',
    missingTierCode = false,
    applicationYearId = 'year-2024',
  } = options;

  return {
    clientId: `id-${clientNumber}`,
    clientNumber,
    firstName: 'John',
    lastName: 'Doe',
    eligibilityStatusCode,
    enrollmentStatusCode,
    earnings: [
      {
        applicationYearId,
        coverageCopayTierTpcCode: missingTierCode ? undefined : coverageCopayTierTpcCode,
        eligibilityStatusCode: earningEligibilityStatusCode,
        taxationYear: 2024,
      },
    ],
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

  describe('mapToClientApplicationRenewalEligibilityDto', () => {
    it('returns INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND when the option is None', async () => {
      const result = await mapper.mapToClientApplicationRenewalEligibilityDto(None);
      expect(result).toEqual({ result: 'INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND' });
    });

    describe('INELIGIBLE-NO-CLIENT-NUMBERS', () => {
      it('returns INELIGIBLE-NO-CLIENT-NUMBERS for a children application with no children', async () => {
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ typeOfApplication: 'children', children: [] })));
        expect(result.result).toBe('INELIGIBLE-NO-CLIENT-NUMBERS');
      });

      it('returns INELIGIBLE-NO-CLIENT-NUMBERS when all children are filtered out by isChildOrYouth', async () => {
        vi.mocked(isChildOrYouth).mockReturnValue(false);
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ typeOfApplication: 'children', children: [makeChild('child-001'), makeChild('child-002')] })));
        expect(result.result).toBe('INELIGIBLE-NO-CLIENT-NUMBERS');
      });
    });

    describe('INELIGIBLE-NO-ELIGIBILITIES', () => {
      it('returns INELIGIBLE-NO-ELIGIBILITIES when no eligibilities exist for any client number', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map());
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('INELIGIBLE-NO-ELIGIBILITIES');
      });
    });

    describe('INELIGIBLE-NOT-ENROLLED', () => {
      it('returns INELIGIBLE-NOT-ENROLLED when the client is not enrolled', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { enrollmentStatusCode: 'not-enrolled' })]]));
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled but profile eligibility status is not eligible', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { eligibilityStatusCode: 'not-eligible' })]]));
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled, profile eligibility status is not eligible, and earning eligibility status is eligible (profile takes precedence)', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
          new Map([
            [
              'client-001',
              makeEligibility('client-001', {
                eligibilityStatusCode: 'not-eligible',
                earningEligibilityStatusCode: SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE,
              }),
            ],
          ]),
        );
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled, no profile eligibility status, and earning eligibility status is not eligible', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
          new Map([
            [
              'client-001',
              makeEligibility('client-001', {
                eligibilityStatusCode: undefined,
                earningEligibilityStatusCode: 'not-eligible',
              }),
            ],
          ]),
        );
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled and profile eligibility status is an empty string (earning eligibility is not consulted)', async () => {
        // An empty string is !== undefined so it is treated as a present-but-non-eligible profile
        // signal; earning eligibility is never consulted regardless of its value.
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
          new Map([
            [
              'client-001',
              makeEligibility('client-001', {
                eligibilityStatusCode: '',
                earningEligibilityStatusCode: SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE,
              }),
            ],
          ]),
        );
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });

      it('returns INELIGIBLE-NOT-ENROLLED when enrolled, no profile status, and no earning matches the application year', async () => {
        // The client has an eligibility record (so it is not INELIGIBLE-NO-ELIGIBILITIES) but
        // its only earning is for a different year and there is no profile status to fall back on.
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { applicationYearId: 'year-2023' })]]));
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ applicationYearId: 'year-2024' })));
        expect(result.result).toBe('INELIGIBLE-NOT-ENROLLED');
      });
    });

    describe('ELIGIBLE', () => {
      it('returns ELIGIBLE when enrolled and profile eligibility status is eligible (profile branch)', async () => {
        // eligibilityStatusCode is explicitly set so the profile branch (Step 2) is exercised
        // and earning eligibility is never consulted.
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
          new Map([
            [
              'client-001',
              makeEligibility('client-001', {
                eligibilityStatusCode: SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE,
                earningEligibilityStatusCode: 'not-eligible', // must be ignored
              }),
            ],
          ]),
        );
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('ELIGIBLE');
      });

      it('qualifies a client via earning eligibility when profile eligibility status is absent', async () => {
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
          new Map([
            [
              'client-001',
              makeEligibility('client-001', {
                eligibilityStatusCode: undefined,
                earningEligibilityStatusCode: SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE,
              }),
            ],
          ]),
        );
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
        expect(result.result).toBe('ELIGIBLE');
      });

      it('qualifies via profile eligibility when no earning matches the application year', async () => {
        // The client has no earning for the renewal year but a present profile eligibilityStatusCode
        // — profile eligibility is authoritative and does not require a matching earning.
        mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
          new Map([
            [
              'client-001',
              makeEligibility('client-001', {
                eligibilityStatusCode: SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE,
                applicationYearId: 'year-2023', // earning is for a different year
              }),
            ],
          ]),
        );
        const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ applicationYearId: 'year-2024' })));
        expect(result.result).toBe('ELIGIBLE');
      });

      it('throws on an unrecognised typeOfApplication (exhaustive guard)', async () => {
        await expect(
          mapper.mapToClientApplicationRenewalEligibilityDto(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Some(makeClientApplication({ typeOfApplication: 'unknown' as any })),
          ),
        ).rejects.toThrow("Unexpected typeOfApplication: 'unknown'");
      });

      describe('typeOfApplication: adult', () => {
        it('includes only the applicant client number in eligibleClientNumbers', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001')]]));
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
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
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ typeOfApplication: 'children', children: [makeChild('child-001'), makeChild('child-002')] })));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.eligibleClientNumbers).toEqual(['child-001', 'child-002']);
        });

        it('only includes children that pass the isChildOrYouth age check', async () => {
          vi.mocked(isChildOrYouth).mockImplementation((dob) => dob === '2015-01-01');
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['child-001', makeEligibility('child-001')]]));
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(
            Some(
              makeClientApplication({
                typeOfApplication: 'children',
                children: [makeChild('child-001', '2015-01-01'), makeChild('child-002', '2006-06-01')],
              }),
            ),
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
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ typeOfApplication: 'family', children: [makeChild('child-001')] })));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.eligibleClientNumbers).toEqual(['client-001', 'child-001']);
        });
      });

      describe('inputModel', () => {
        it('returns simplified when a single client has a valid tier code', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { coverageCopayTierTpcCode: 'tier-2' })]]));
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('simplified');
        });

        it('returns simplified when multiple clients all share the same valid tier code', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
            new Map([
              ['client-001', makeEligibility('client-001', { coverageCopayTierTpcCode: 'tier-3' })],
              ['child-001', makeEligibility('child-001', { coverageCopayTierTpcCode: 'tier-3' })],
            ]),
          );
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ typeOfApplication: 'family', children: [makeChild('child-001')] })));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('simplified');
        });

        it('returns full when clients have different valid tier codes', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
            new Map([
              ['client-001', makeEligibility('client-001', { coverageCopayTierTpcCode: 'tier-1' })],
              ['child-001', makeEligibility('child-001', { coverageCopayTierTpcCode: 'tier-2' })],
            ]),
          );
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ typeOfApplication: 'family', children: [makeChild('child-001')] })));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('full');
        });

        it('returns full when a client has an unrecognised tier code', async () => {
          vi.mocked(isValidCoverageCopayTierCode).mockReturnValue(false);
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { coverageCopayTierTpcCode: 'tier-unknown' })]]));
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('full');
        });

        it('returns full when a client has no tier code (coverageCopayTierTpcCode is undefined)', async () => {
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(new Map([['client-001', makeEligibility('client-001', { missingTierCode: true })]]));
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication()));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('full');
        });

        it('returns full when the eligible client has no matching earning (no tier code available)', async () => {
          // Profile-eligible client whose only earning is for a different year → earning is undefined
          // → no coverageCopayTierTpcCode can be read → allValidTierCodes is false → 'full'.
          mockClientEligibilityService.listClientEligibilitiesByClientNumbers.mockResolvedValue(
            new Map([
              [
                'client-001',
                makeEligibility('client-001', {
                  eligibilityStatusCode: SERVER_CONFIG.ELIGIBILITY_STATUS_CODE_ELIGIBLE,
                  applicationYearId: 'year-2023', // earning is for a different year
                }),
              ],
            ]),
          );
          const result = await mapper.mapToClientApplicationRenewalEligibilityDto(Some(makeClientApplication({ applicationYearId: 'year-2024' })));
          assert(result.result === 'ELIGIBLE');
          expect(result.clientApplication.inputModel).toBe('full');
        });
      });
    });
  });
});
