import { inject, injectable } from 'inversify';
import type { Option } from 'oxide.ts';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientApplicationDto, ClientApplicationRenewalEligibilityDto, ClientEligibilityDto } from '~/.server/domain/dtos';
import type { ClientEligibilityService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { isChildOrYouth } from '~/.server/routes/helpers/base-application-route-helpers';
import { isValidCoverageCopayTierCode } from '~/.server/utils/coverage.utils';

/** A client eligibility record flattened to a single earning for a specific application year. */
type ClientEligibilityWithEarning = OmitStrict<ClientEligibilityDto, 'earnings'> & {
  earning: ClientEligibilityDto['earnings'][number];
};

/**
 * Narrows {@link ClientEligibilityWithEarning} to records where `coverageCopayTierCode` is guaranteed
 * to be a non-optional `string`. The cast to this type in {@link getEnrolledAndEligibleClients} is
 * safe because the filter predicate already asserts `coverageCopayTierCode !== undefined`.
 */
type EnrolledEligibleClient = OmitStrict<ClientEligibilityWithEarning, 'earning'> & {
  earning: ClientEligibilityWithEarning['earning'] & { coverageCopayTierCode?: string };
};

export interface ClientApplicationRenewalEligibilityDtoMapper {
  /**
   * Maps a client application DTO option to a renewal eligibility DTO.
   * @param clientApplicationDtoOption - The client application, or None if not found.
   * @returns A promise resolving to `INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND`, `INELIGIBLE-NO-CLIENT-NUMBERS`,
   *   `INELIGIBLE-NO-ELIGIBILITIES`, `INELIGIBLE-NOT-ENROLLED`, or `ELIGIBLE`.
   */
  mapToClientApplicationRenewalEligibilityDto(clientApplicationDtoOption: Option<ClientApplicationDto>): Promise<ClientApplicationRenewalEligibilityDto>;
}

type DefaultClientApplicationRenewalEligibilityDtoMapper_ServerConfig = Pick<ServerConfig, 'ELIGIBILITY_STATUS_CODE_ELIGIBLE' | 'ENROLLMENT_STATUS_CODE_ENROLLED'>;

@injectable()
export class DefaultClientApplicationRenewalEligibilityDtoMapper implements ClientApplicationRenewalEligibilityDtoMapper {
  private readonly log: Logger;
  private readonly clientEligibilityService: ClientEligibilityService;
  private readonly serverConfig: DefaultClientApplicationRenewalEligibilityDtoMapper_ServerConfig;

  constructor(
    @inject(TYPES.ClientEligibilityService) clientEligibilityService: ClientEligibilityService, //
    @inject(TYPES.ServerConfig) serverConfig: DefaultClientApplicationRenewalEligibilityDtoMapper_ServerConfig,
  ) {
    this.log = createLogger('DefaultClientApplicationRenewalEligibilityDtoMapper');
    this.clientEligibilityService = clientEligibilityService;
    this.serverConfig = serverConfig;
  }

  /**
   * Maps a client application DTO to a renewal eligibility DTO:
   *
   * 1. None → `INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND`.
   * 2. Filter children to those in the `'children'` or `'youth'` age category as of the renewal
   *    reference date (see `isChildOrYouth`).
   * 3. Derive client numbers by application type (`'adult'` / `'children'` / `'family'`).
   *    No client numbers → `INELIGIBLE-NO-CLIENT-NUMBERS`.
   * 4. Fetch eligibilities for the derived client numbers, keeping only those
   *    with an earning for the application year. None found → `INELIGIBLE-NO-ELIGIBILITIES`.
   * 5. Filter to clients that are enrolled, have `isEligible: true`, and have a
   *    defined `coverageCopayTierCode`. None passing → `INELIGIBLE-NOT-ENROLLED`.
   * 6. Return `ELIGIBLE` with the passing client numbers and an input model of
   *    `'simplified'` (all share one valid copay tier) or `'full'` (mixed tiers).
   */
  async mapToClientApplicationRenewalEligibilityDto(clientApplicationDtoOption: Option<ClientApplicationDto>): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Mapping client application dto to client application renewal eligibility dto: [%j]', clientApplicationDtoOption.unwrapUnchecked());

    if (clientApplicationDtoOption.isNone()) {
      this.log.debug('Client application dto is None, returning not found result');
      return { result: 'INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND' };
    }

    const clientApplicationDto = this.filterEligibleChildrenByAge(clientApplicationDtoOption.unwrap());

    const clientNumbers = this.listClientNumbers(clientApplicationDto);
    if (clientNumbers.length === 0) {
      this.log.debug('No client numbers found for client application, returning ineligible result');
      return {
        result: 'INELIGIBLE-NO-CLIENT-NUMBERS',
        clientApplication: clientApplicationDto,
      };
    }

    const clientEligibilities = await this.listClientEligibilities(clientNumbers, clientApplicationDto.applicationYearId);
    if (clientEligibilities.size === 0) {
      this.log.debug('No client eligibilities found for client application, returning ineligible result');
      return {
        result: 'INELIGIBLE-NO-ELIGIBILITIES',
        clientApplication: clientApplicationDto,
      };
    }

    const enrolledAndEligibleClients = this.getEnrolledAndEligibleClients(clientEligibilities);
    if (enrolledAndEligibleClients.size === 0) {
      this.log.debug('No enrolled and eligible clients found for client application, returning ineligible result');
      return {
        result: 'INELIGIBLE-NOT-ENROLLED',
        clientApplication: clientApplicationDto,
      };
    }

    this.log.debug('Client application is eligible for renewal, returning eligible result');

    return {
      result: 'ELIGIBLE',
      clientApplication: {
        ...clientApplicationDto,
        eligibleClientNumbers: [...enrolledAndEligibleClients.keys()],
        inputModel: this.getInputModelForEnrolledAndEligibleClients(enrolledAndEligibleClients),
      },
    };
  }

  /**
   * Returns a copy of the DTO keeping only children in the `'children'` or `'youth'` age category
   * as of the renewal reference date (determined by `isChildOrYouth`).
   */
  private filterEligibleChildrenByAge(clientApplicationDto: ClientApplicationDto): ClientApplicationDto {
    const eligibleChildren = clientApplicationDto.children.filter((child) => isChildOrYouth(child.information.dateOfBirth, 'renewal'));
    this.log.trace('Filtered children by age: [%d] of [%d] children eligible for renewal', eligibleChildren.length, clientApplicationDto.children.length);
    return {
      ...clientApplicationDto,
      children: eligibleChildren,
    };
  }

  /**
   * Returns client numbers for the application:
   * - `'adult'` → applicant only
   * - `'children'` → children only
   * - `'family'` → applicant and children
   *
   * Throws on any unrecognised `typeOfApplication` value via the exhaustive `default` branch,
   * which also produces a TypeScript compile error if the union ever gains a new variant.
   */
  private listClientNumbers(clientApplicationDto: Pick<ClientApplicationDto, 'typeOfApplication' | 'applicantInformation' | 'children'>): ReadonlyArray<string> {
    switch (clientApplicationDto.typeOfApplication) {
      case 'adult': {
        // primary applicant client number only
        return [clientApplicationDto.applicantInformation.clientNumber];
      }

      case 'children': {
        // children client numbers only
        return clientApplicationDto.children.map((child) => child.information.clientNumber);
      }

      case 'family': {
        // primary applicant client number and children client numbers
        return [
          clientApplicationDto.applicantInformation.clientNumber, //
          ...clientApplicationDto.children.map((child) => child.information.clientNumber),
        ];
      }

      default: {
        const _exhaustive: never = clientApplicationDto.typeOfApplication;
        throw new Error(`Unexpected typeOfApplication: '${_exhaustive}'`);
      }
    }
  }

  /**
   * Fetches eligibilities for the given client numbers and returns a map of those that have an
   * earning matching `applicationYearId`. Client numbers with no eligibility record or no matching
   * earning are silently omitted — the returned map may therefore be smaller than `clientNumbers`.
   */
  private async listClientEligibilities(clientNumbers: ReadonlyArray<string>, applicationYearId: string): Promise<ReadonlyMap<string, ClientEligibilityWithEarning>> {
    const eligibilities = await this.clientEligibilityService.listClientEligibilitiesByClientNumbers(clientNumbers);
    const entries: Array<[string, ClientEligibilityWithEarning]> = [];

    for (const clientNumber of clientNumbers) {
      const eligibility = eligibilities.get(clientNumber);
      if (!eligibility) {
        this.log.trace('No eligibility found for client number [%s], skipping', clientNumber);
        continue;
      }

      const { earnings, ...restEligibility } = eligibility;

      const earning = earnings.find((earning) => earning.applicationYearId === applicationYearId);
      if (!earning) {
        this.log.trace('No earning found for client number [%s] and application year [%s], skipping', clientNumber, applicationYearId);
        continue;
      }

      entries.push([clientNumber, { ...restEligibility, earning }]);
    }

    return new Map(entries);
  }

  /**
   * Filters `clientEligibilities` down to clients that are enrolled **and** eligible,
   * applying the following three-step decision for each client:
   *
   * 1. **Enrollment check** — the client's `enrollmentStatusCode` must equal
   *    `ENROLLMENT_STATUS_CODE_ENROLLED`. Clients that fail this check are skipped entirely.
   *
   * 2. **Profile eligibility check** — when `eligibilityStatusCode` is present on the client
   *    profile, it is the authoritative signal. If eligible, the client qualifies; if not,
   *    the client is excluded. Earning eligibility is **not** consulted in either case.
   *
   * 3. **Earning eligibility fallback** — only reached when `eligibilityStatusCode` is absent
   *    (`undefined`) on the client profile. The earning's own `eligibilityStatusCode` is used
   *    as the eligibility signal instead.
   */
  private getEnrolledAndEligibleClients(clientEligibilities: ReadonlyMap<string, ClientEligibilityWithEarning>): ReadonlyMap<string, EnrolledEligibleClient> {
    const entries: Array<[string, EnrolledEligibleClient]> = [];

    for (const [clientNumber, eligibility] of clientEligibilities) {
      // Step 1: enrollment gate — skip clients that are not enrolled.
      const isEnrolled = eligibility.enrollmentStatusCode === this.serverConfig.ENROLLMENT_STATUS_CODE_ENROLLED;
      this.log.trace('Checking client number [%s] enrollment status: isEnrolled=[%s]', clientNumber, isEnrolled);
      if (!isEnrolled) {
        continue;
      }

      // Step 2: profile eligibility — when present, it is authoritative and earning eligibility
      // is never consulted (the `continue` below enforces this regardless of the outcome).
      if (eligibility.eligibilityStatusCode !== undefined) {
        const isEligible = eligibility.eligibilityStatusCode === this.serverConfig.ELIGIBILITY_STATUS_CODE_ELIGIBLE;
        this.log.trace('Checking client number [%s] profile eligibility: isEnrolled=[%s], isEligible=[%s]', clientNumber, isEnrolled, isEligible);
        if (isEligible) {
          entries.push([clientNumber, eligibility as EnrolledEligibleClient]);
        }
        continue;
      }

      // Step 3: earning eligibility fallback — only reached when the profile has no eligibility
      // status code, meaning we must rely on the earning-level status instead.
      const isEarningEligible = eligibility.earning.eligibilityStatusCode === this.serverConfig.ELIGIBILITY_STATUS_CODE_ELIGIBLE;
      this.log.trace('Checking client number [%s] earning eligibility (no profile status): isEnrolled=[%s], isEarningEligible=[%s]', clientNumber, isEnrolled, isEarningEligible);

      if (isEarningEligible) {
        entries.push([clientNumber, eligibility as EnrolledEligibleClient]);
      }
    }

    return new Map(entries);
  }

  /**
   * Determines the input model to use for the renewal form.
   *
   * Returns `'simplified'` only when both conditions hold:
   * 1. Every client's `coverageCopayTierCode` is a recognised valid tier code (see `isValidCoverageCopayTierCode`).
   * 2. All clients share the exact same tier code.
   *
   * Returns `'full'` if any tier code is missing, unrecognised, or clients have different tier codes.
   */
  private getInputModelForEnrolledAndEligibleClients(enrolledAndEligibleClients: ReadonlyMap<string, EnrolledEligibleClient>): 'simplified' | 'full' {
    const tierCodes = [...enrolledAndEligibleClients.values()].map(({ earning }) => earning.coverageCopayTierCode);

    const allValidTierCodes = tierCodes.every((code) => typeof code === 'string' && isValidCoverageCopayTierCode(code));
    if (!allValidTierCodes) return 'full';

    const allClientsShareSameTierCode = new Set(tierCodes).size === 1;
    if (!allClientsShareSameTierCode) return 'full';

    return 'simplified';
  }
}
