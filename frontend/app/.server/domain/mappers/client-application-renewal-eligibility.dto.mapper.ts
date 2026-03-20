import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ApplicantDto, ClientApplicationDto, ClientApplicationRenewalEligibilityDto, ClientEligibilityDto } from '~/.server/domain/dtos';
import type { ClientApplicationDtoMapper } from '~/.server/domain/mappers/client-application.dto.mapper';
import type { ClientEligibilityService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { isChildOrYouth } from '~/.server/routes/helpers/base-application-route-helpers';
import { isValidCoverageCopayTierCode } from '~/.server/utils/coverage.utils';
import { getAgeFromDateString } from '~/utils/date-utils';

export interface ClientApplicationRenewalEligibilityDtoMapper {
  /**
   * Maps an applicant DTO to a client application renewal eligibility DTO.
   * @param applicantDto - The applicant DTO.
   * @param applicationYearId - The application year ID.
   * @returns A promise resolving to a `ClientApplicationRenewalEligibilityDto`.
   */
  mapApplicantDtoToClientApplicationRenewalEligibilityDto(applicantDto: ApplicantDto, applicationYearId: string): Promise<ClientApplicationRenewalEligibilityDto>;

  /**
   * Maps a client application DTO option to a renewal eligibility DTO.
   * @param clientApplicationDto - The client application, or None if not found.
   * @returns A promise resolving to `INELIGIBLE-NO-CLIENT-NUMBERS`, `INELIGIBLE-NO-ELIGIBILITIES`, `INELIGIBLE-NOT-ENROLLED`, or `ELIGIBLE`.
   */
  mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(clientApplicationDto: ClientApplicationDto): Promise<ClientApplicationRenewalEligibilityDto>;
}

type DefaultClientApplicationRenewalEligibilityDtoMapper_ServerConfig = Pick<ServerConfig, 'ELIGIBILITY_STATUS_CODE_ELIGIBLE' | 'ENROLLMENT_STATUS_CODE_ENROLLED'>;

@injectable()
export class DefaultClientApplicationRenewalEligibilityDtoMapper implements ClientApplicationRenewalEligibilityDtoMapper {
  private readonly log: Logger;
  private readonly clientApplicationDtoMapper: ClientApplicationDtoMapper;
  private readonly clientEligibilityService: ClientEligibilityService;
  private readonly serverConfig: DefaultClientApplicationRenewalEligibilityDtoMapper_ServerConfig;

  constructor(
    @inject(TYPES.ClientApplicationDtoMapper) clientApplicationDtoMapper: ClientApplicationDtoMapper,
    @inject(TYPES.ClientEligibilityService) clientEligibilityService: ClientEligibilityService, //
    @inject(TYPES.ServerConfig) serverConfig: DefaultClientApplicationRenewalEligibilityDtoMapper_ServerConfig,
  ) {
    this.log = createLogger('DefaultClientApplicationRenewalEligibilityDtoMapper');
    this.clientApplicationDtoMapper = clientApplicationDtoMapper;
    this.clientEligibilityService = clientEligibilityService;
    this.serverConfig = serverConfig;
  }

  /**
   * Maps an applicant DTO to a client application renewal eligibility DTO:
   *
   * 1. Calculate the applicant's age at intake using `dateOfBirth` and today's date.
   * 2. If the applicant is not 18 years old at intake, return `INELIGIBLE-APPLICANT-NOT-18-YEARS-OLD`.
   * 3. Otherwise, map the applicant DTO to a client application DTO and delegate to
   * `mapClientApplicationDtoToClientApplicationRenewalEligibilityDto`.
   *
   * @param applicantDto - The applicant DTO.
   * @param applicationYearId - The application year ID.
   * @returns A promise resolving to a `ClientApplicationRenewalEligibilityDto`.
   */
  async mapApplicantDtoToClientApplicationRenewalEligibilityDto(applicantDto: ApplicantDto, applicationYearId: string): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Mapping applicant dto to client application renewal eligibility dto: [%j]', applicantDto);

    const ageReferenceDate = new Date().toISOString().slice(0, 10); // today - yyyy-mm-dd
    const applicantAge = getAgeFromDateString(applicantDto.dateOfBirth, ageReferenceDate);
    this.log.trace('Applicant age: [%s], date of birth: [%s], intake age reference date: [%s]', applicantAge, applicantDto.dateOfBirth, ageReferenceDate);

    const applicantAgeIs18YearsOld = applicantAge >= 18 && applicantAge < 19;
    if (!applicantAgeIs18YearsOld) {
      this.log.debug('Applicant age is not 18 years old at intake, returning ineligible result');
      return { result: 'INELIGIBLE-APPLICANT-NOT-18-YEARS-OLD' };
    }

    const cliientApplicationDto = this.clientApplicationDtoMapper.mapApplicantDtoToClientApplicationDto({ applicantDto, applicationYearId, typeOfApplication: 'adult' });
    return await this.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(cliientApplicationDto);
  }

  /**
   * Maps a client application DTO to a renewal eligibility DTO:
   *
   * The mapping applies the following rules to determine the renewal eligibility result:
   *
   * 1. If the application has a `previousApplication`, return `INELIGIBLE-ALREADY-RENEWED`.
   * 2. Filter children to those in the `'children'` or `'youth'` age category as of the renewal
   *    reference date (see `isChildOrYouth`).
   * 3. Derive client numbers by application type (`'adult'` / `'children'` / `'family'`).
   *    No client numbers → `INELIGIBLE-NO-CLIENT-NUMBERS`.
   * 4. Fetch eligibilities for the derived client numbers. Clients with no eligibility record
   *    are silently omitted; None found at all → `INELIGIBLE-NO-ELIGIBILITIES`.
   * 5. Filter to clients that are enrolled and eligible. None passing
   *    → `INELIGIBLE-NOT-ENROLLED`.
   * 6. Return `ELIGIBLE` with the passing client numbers and an input model of
   *    `'simplified'` (the application has a valid copay tier code) or `'full'` (missing or unrecognised tier code).
   */
  async mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(clientApplicationDto: ClientApplicationDto): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Mapping client application dto to client application renewal eligibility dto: [%j]', clientApplicationDto);

    if (clientApplicationDto.previousApplication) {
      this.log.debug('Client application has a previous application, returning ineligible result');
      return { result: 'INELIGIBLE-ALREADY-RENEWED', clientApplication: clientApplicationDto };
    }

    const filteredClientApplicationDto = this.filterEligibleChildrenByAge(clientApplicationDto);

    const clientNumbers = this.listClientNumbers(filteredClientApplicationDto);
    if (clientNumbers.length === 0) {
      this.log.debug('No client numbers found for client application, returning ineligible result');
      return {
        result: 'INELIGIBLE-NO-CLIENT-NUMBERS',
        clientApplication: clientApplicationDto,
      };
    }

    const clientEligibilities = await this.listClientEligibilities(clientNumbers);
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
        inputModel: this.getInputModel(clientApplicationDto),
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
    return { ...clientApplicationDto, children: eligibleChildren };
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
   * Fetches eligibilities for the given client numbers and returns a map keyed by client number.
   */
  private async listClientEligibilities(clientNumbers: ReadonlyArray<string>): Promise<ReadonlyMap<string, ClientEligibilityDto>> {
    const eligibilities = await this.clientEligibilityService.listClientEligibilitiesByClientNumbers(clientNumbers);
    const entries: Array<[string, ClientEligibilityDto]> = [];

    for (const clientNumber of clientNumbers) {
      const eligibility = eligibilities.get(clientNumber);

      if (!eligibility) {
        this.log.trace('No client eligibility found for client number [%s], skipping', clientNumber);
        continue;
      }

      this.log.trace('Client eligibility for client number [%s]: [%j]', clientNumber, eligibility);
      entries.push([clientNumber, eligibility]);
    }

    return new Map(entries);
  }

  /**
   * Filters `clientEligibilities` down to clients that are enrolled **and** eligible,
   * applying the following two-step decision for each client:
   *
   * 1. **Enrollment check** — the client's `enrollmentStatusCode` must equal
   *    `ENROLLMENT_STATUS_CODE_ENROLLED`. Clients that fail this check are skipped entirely.
   *
   * 2. **Profile eligibility check** — the client's `eligibilityStatusCode` must equal
   *    `ELIGIBILITY_STATUS_CODE_ELIGIBLE`. Clients that fail this check are skipped.
   */
  private getEnrolledAndEligibleClients(clientEligibilities: ReadonlyMap<string, ClientEligibilityDto>): ReadonlyMap<string, ClientEligibilityDto> {
    const entries: Array<[string, ClientEligibilityDto]> = [];

    for (const [clientNumber, eligibility] of clientEligibilities) {
      // Step 1: enrollment gate — skip clients that are not enrolled.
      const isEnrolled = eligibility.enrollmentStatusCode === this.serverConfig.ENROLLMENT_STATUS_CODE_ENROLLED;
      this.log.trace('Checking client number [%s] enrollment status: isEnrolled=[%s]', clientNumber, isEnrolled);
      if (!isEnrolled) {
        continue;
      }

      // Step 2: profile eligibility
      const isEligible = eligibility.eligibilityStatusCode === this.serverConfig.ELIGIBILITY_STATUS_CODE_ELIGIBLE;
      this.log.trace('Checking client number [%s] profile eligibility: isEnrolled=[%s], isEligible=[%s]', clientNumber, isEnrolled, isEligible);
      if (isEligible) {
        entries.push([clientNumber, eligibility]);
      }
    }

    return new Map(entries);
  }

  /**
   * Determines the input model for the renewal application based on the application's
   * `coverageCopayTierCode`:
   *
   * - Valid tier code → `'simplified'` (fewer fields required in the renewal form).
   * - Missing or unrecognised tier code → `'full'` (all fields required).
   */
  private getInputModel(clientApplication: ClientApplicationDto): 'simplified' | 'full' {
    const { applicantInformation, applicationYearId, coverageCopayTierCode } = clientApplication;

    if (!coverageCopayTierCode || !isValidCoverageCopayTierCode(coverageCopayTierCode)) {
      this.log.trace('Client application with client number [%s] and application year [%s] has no valid coverage copay tier code, using full input model', applicantInformation.clientNumber, applicationYearId);
      return 'full';
    }

    this.log.trace('Client application with client number [%s] and application year [%s] has valid coverage copay tier code [%s], using simplified input model', applicantInformation.clientNumber, applicationYearId, coverageCopayTierCode);
    return 'simplified';
  }
}
