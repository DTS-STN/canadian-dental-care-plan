import { inject, injectable } from 'inversify';
import type { Option } from 'oxide.ts';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientApplicationDto, ClientApplicationRenewalEligibilityDto, ClientEligibilityDto } from '~/.server/domain/dtos';
import type { ClientEligibilityService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { isChildEligible } from '~/.server/routes/helpers/base-application-route-helpers';

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
  earning: ClientEligibilityWithEarning['earning'] & { coverageCopayTierCode: string };
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

@injectable()
export class DefaultClientApplicationRenewalEligibilityDtoMapper implements ClientApplicationRenewalEligibilityDtoMapper {
  private readonly log: Logger;
  private readonly clientEligibilityService: ClientEligibilityService;
  private readonly serverConfig: Pick<ServerConfig, 'ENROLLMENT_STATUS_CODE_ENROLLED'>;

  constructor(
    @inject(TYPES.ClientEligibilityService) clientEligibilityService: ClientEligibilityService, //
    @inject(TYPES.ServerConfig) serverConfig: Pick<ServerConfig, 'ENROLLMENT_STATUS_CODE_ENROLLED'>,
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
   *    reference date (see `isChildEligible`).
   * 3. Derive client numbers by application type (`'adult'` / `'children'` / `'family'`).
   *    No client numbers → `INELIGIBLE-NO-CLIENT-NUMBERS`.
   * 4. Fetch eligibilities for the derived client numbers, keeping only those
   *    with an earning for the application year. None found → `INELIGIBLE-NO-ELIGIBILITIES`.
   * 5. Filter to clients that are enrolled, have `isEligible: true`, and have a
   *    defined `coverageCopayTierCode`. None passing → `INELIGIBLE-NOT-ENROLLED`.
   * 6. Return `ELIGIBLE` with the passing client numbers and an input model of
   *    `'simplified'` (all share one copay tier) or `'full'` (mixed tiers).
   */
  async mapToClientApplicationRenewalEligibilityDto(clientApplicationDtoOption: Option<ClientApplicationDto>): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Mapping client application dto to client application renewal eligibility dto: [%j]', clientApplicationDtoOption);

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
        eligibleClientNumbers: new Set(enrolledAndEligibleClients.keys()),
        inputModel: this.getInputModelForEnrolledAndEligibleClients(enrolledAndEligibleClients),
      },
    };
  }

  /**
   * Returns a copy of the DTO keeping only children in the `'children'` or `'youth'` age category
   * as of the renewal reference date (determined by `isChildEligible`).
   */
  private filterEligibleChildrenByAge(clientApplicationDto: ClientApplicationDto): ClientApplicationDto {
    const eligibleChildren = clientApplicationDto.children.filter((child) => isChildEligible(child.information.dateOfBirth, 'renewal'));
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
   * Filters to clients that are enrolled (`enrollmentStatusCode === ENROLLMENT_STATUS_CODE_ENROLLED`),
   * have `isEligible: true`, and have a defined `coverageCopayTierCode`.
   */
  private getEnrolledAndEligibleClients(clientEligibilities: ReadonlyMap<string, ClientEligibilityWithEarning>): ReadonlyMap<string, EnrolledEligibleClient> {
    const entries: Array<[string, EnrolledEligibleClient]> = [];

    for (const [clientNumber, eligibility] of clientEligibilities) {
      const isEnrolled = eligibility.enrollmentStatusCode === this.serverConfig.ENROLLMENT_STATUS_CODE_ENROLLED;
      const isEligible = eligibility.earning.isEligible;
      const coverageCopayTierCode = eligibility.earning.coverageCopayTierCode;

      this.log.trace('Checking client number [%s] for enrollment and eligibility: isEnrolled=[%s], isEligible=[%s], coverageCopayTierCode=[%s]', clientNumber, isEnrolled, isEligible, coverageCopayTierCode);

      if (isEnrolled && isEligible && coverageCopayTierCode) {
        entries.push([clientNumber, eligibility as EnrolledEligibleClient]);
      }
    }

    return new Map(entries);
  }

  /**
   * Returns `'simplified'` if all clients share the same `coverageCopayTierCode`, otherwise `'full'`.
   */
  private getInputModelForEnrolledAndEligibleClients(enrolledAndEligibleClients: ReadonlyMap<string, EnrolledEligibleClient>): 'simplified' | 'full' {
    const seen = new Set<string>();
    for (const { earning } of enrolledAndEligibleClients.values()) {
      seen.add(earning.coverageCopayTierCode);
      if (seen.size > 1) return 'full';
    }
    return 'simplified';
  }
}
