import { invariant } from '@dts-stn/invariant';
import { inject, injectable } from 'inversify';
import type { Option } from 'oxide.ts';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientApplicationDto, ClientApplicationRenewalEligibilityDto, ClientEligibilityDto } from '~/.server/domain/dtos';
import type { ClientEligibilityService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { isChildEligible } from '~/.server/routes/helpers/base-application-route-helpers';

export interface ClientApplicationRenewalEligibilityDtoMapper {
  /**
   * Maps a ClientApplicationDto option to a ClientApplicationRenewalEligibilityDto.
   * @param clientApplicationDtoOption - The option containing the ClientApplicationDto.
   * @returns A promise that resolves to a ClientApplicationRenewalEligibilityDto.
   */
  mapToClientApplicationRenewalEligibilityDto(clientApplicationDtoOption: Option<ClientApplicationDto>): Promise<ClientApplicationRenewalEligibilityDto>;
}

@injectable()
export class DefaultClientApplicationRenewalEligibilityDtoMapper implements ClientApplicationRenewalEligibilityDtoMapper {
  private log: Logger;
  private clientEligibilityService: ClientEligibilityService;
  private serverConfig: Pick<ServerConfig, 'ENROLLMENT_STATUS_CODE_ENROLLED'>;

  constructor(
    @inject(TYPES.ClientEligibilityService) clientEligibilityService: ClientEligibilityService, //
    @inject(TYPES.ServerConfig) serverConfig: Pick<ServerConfig, 'ENROLLMENT_STATUS_CODE_ENROLLED'>,
  ) {
    this.log = createLogger('DefaultClientApplicationRenewalEligibilityDtoMapper');
    this.clientEligibilityService = clientEligibilityService;
    this.serverConfig = serverConfig;
  }

  /**
   * Maps a client application DTO to a client application renewal eligibility DTO. The mapping process involves several
   * steps:
   *
   * 1. If the client application DTO is None, the result is an ineligible result with a reason of
   *    'CLIENT-APPLICATION-NOT-FOUND'.
   *
   * 2. If the client application DTO is Some, we filter the children of the client application DTO to include only
   *    those who are eligible for renewal based on their date of birth and the renewal context.
   *
   * 3. We check if the client application is eligible to renew based on its eligibility status code. If the eligibility
   *    status code is missing or empty (i.e., falsy), the application is assumed to be eligible to renew. If the
   *    eligibility status code is defined, we check if it is equal to the eligible status code defined in the server
   *    configuration. If the client application is not eligible to renew based on its eligibility status code, the
   *    result is an ineligible result with a reason of 'INELIGIBLE'.
   *
   * 4. If the client application is eligible to renew based on its eligibility status code, we list the client numbers
   *    associated with the client application DTO. The client numbers are determined based on the type of application
   *    (adult, child, or adult-child). For adult applications, only the primary applicant's client number is included.
   *    For child applications, only the children's client numbers are included. For family applications (adult-child),
   *    both the primary applicant's client number and the children's client numbers are included.
   *
   * 5. We list the client eligibilities for the listed client numbers and the application year ID of the client
   *    application DTO. The client eligibilities are retrieved from the client eligibility service and mapped to
   *    include only the specific earning for the given application year ID. The result is a map of client numbers to
   *    their corresponding eligibility information, including the specific earning for the application year.
   *
   * 6. We filter the listed client eligibilities to include only those clients who are enrolled and eligible. A client
   *    is considered enrolled if their enrollment status code is equal to the enrolled status code defined in the
   *    server configuration. A client is considered eligible if their earning is marked as eligible and has a defined
   *    coverage copay tier code. The result is a map of client numbers to their corresponding eligibility information
   *    for those clients who are enrolled and eligible.
   *
   * 7. If there are no enrolled and eligible clients, the result is an ineligible result with a reason of 'INELIGIBLE'.
   *
   * 8. If there are enrolled and eligible clients, the result is an eligible result that includes the client
   *    application DTO, the list of eligible client numbers, and the input model type for the enrolled and eligible
   *    clients. The input model type is determined based on whether all enrolled and eligible clients have the same
   *    coverage copay tier code. If all enrolled and eligible clients have the same coverage copay tier code, the input
   *    model type is 'simplified'. Otherwise, the input model type is 'full'.
   *
   * @param clientApplicationDtoOption - The client application DTO wrapped in an Option type, which can be either Some
   *    (if the client application DTO is present) or None (if the client application DTO is not found).
   * @returns A promise that resolves to a ClientApplicationRenewalEligibilityDto, which indicates whether the client
   *    application is eligible for renewal and includes relevant information based on the eligibility result.
   */
  async mapToClientApplicationRenewalEligibilityDto(clientApplicationDtoOption: Option<ClientApplicationDto>): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Mapping client application dto to client application renewal eligibility dto: [%j]', clientApplicationDtoOption);

    if (clientApplicationDtoOption.isNone()) {
      this.log.debug('Client application dto is None, returning not found result');
      return { result: 'CLIENT-APPLICATION-NOT-FOUND' };
    }

    const clientApplicationDto = this.filterEligibleChildrenByAge(clientApplicationDtoOption.unwrap());
    const clientNumbers = this.listClientNumbers(clientApplicationDto);

    if (clientNumbers.length === 0) {
      this.log.debug('No client numbers found for client application, returning ineligible result');
      return { result: 'INELIGIBLE', clientApplication: clientApplicationDto };
    }

    const applicationYearId = clientApplicationDto.applicationYearId;
    const clientEligibilities = await this.listClientEligibilities(clientNumbers, applicationYearId);

    if (clientEligibilities.size === 0) {
      this.log.debug('No client eligibilities found for client application, returning ineligible result');
      return { result: 'INELIGIBLE', clientApplication: clientApplicationDto };
    }

    const enrolledAndEligibleClients = this.getEnrolledAndEligibleClients(clientEligibilities);

    if (enrolledAndEligibleClients.size === 0) {
      this.log.debug('No enrolled and eligible clients found for client application, returning ineligible result');
      return { result: 'INELIGIBLE', clientApplication: clientApplicationDto };
    }

    this.log.debug('Client application is eligible for renewal, returning eligible result');

    return {
      result: 'ELIGIBLE',
      clientApplication: clientApplicationDto,
      eligibleClientNumbers: [...enrolledAndEligibleClients.keys()],
      inputModel: this.getInputModelForEnrolledAndEligibleClients(enrolledAndEligibleClients),
    };
  }

  /**
   * Filters the children of the given client application DTO to include only those who are eligible for renewal based
   * on their date of birth and the renewal context. The eligibility is determined by calculating the age category of
   * each child using their date of birth and the appropriate reference date for the renewal context. A child is
   * considered eligible if they fall into the 'children' or 'youth' age categories.
   *
   * @param clientApplicationDto The client application DTO whose children are to be filtered for renewal eligibility.
   * @returns A new client application DTO with the children filtered to include only those who are eligible for renewal
   *          based on their age.
   */
  private filterEligibleChildrenByAge(clientApplicationDto: ClientApplicationDto): ClientApplicationDto {
    return {
      ...clientApplicationDto,
      children: clientApplicationDto.children.filter((child) => {
        return isChildEligible(child.information.dateOfBirth, 'renewal');
      }),
    };
  }

  /**
   * Lists the client numbers associated with the given client application DTO. The client numbers are determined based
   * on the type of application (adult, child, or adult-child). For adult applications, only the primary applicant's
   * client number is included. For child applications, only the children's client numbers are included. For family
   * applications (adult-child), both the primary applicant's client number and the children's client numbers are included.
   */
  private listClientNumbers(clientApplicationDto: ClientApplicationDto): ReadonlyArray<string> {
    if (clientApplicationDto.typeOfApplication === 'adult') {
      // primary applicant client number only
      return [clientApplicationDto.applicantInformation.clientNumber];
    }

    if (clientApplicationDto.typeOfApplication === 'child') {
      // children client numbers only
      return clientApplicationDto.children.map((child) => child.information.clientNumber);
    }

    // family application (adult-child)
    invariant(clientApplicationDto.typeOfApplication === 'adult-child', 'Expected typeOfApplication to be "adult-child" for family applications');

    // primary applicant client number and children client numbers
    return [
      clientApplicationDto.applicantInformation.clientNumber, //
      ...clientApplicationDto.children.map((child) => child.information.clientNumber),
    ];
  }

  /**
   * Lists the client eligibilities for the given client numbers and application year ID. The client eligibilities are
   * retrieved from the client eligibility service and mapped to include only the specific earning for the given
   * application year ID. The result is a map of client numbers to their corresponding eligibility information,
   * including the specific earning for the application year.
   *
   * @param clientNumbers The client numbers for which to list eligibilities.
   * @param applicationYearId The application year ID for which to list eligibilities.
   * @returns A map of client numbers to their corresponding eligibility information, including the specific earning for the application year.
   */
  private async listClientEligibilities(clientNumbers: ReadonlyArray<string>, applicationYearId: string): Promise<ReadonlyMap<string, OmitStrict<ClientEligibilityDto, 'earnings'> & { earning: ClientEligibilityDto['earnings'][number] }>> {
    const eligibilities = await this.clientEligibilityService.listClientEligibilitiesByClientNumbers(clientNumbers);
    const entries: Array<[string, OmitStrict<ClientEligibilityDto, 'earnings'> & { earning: ClientEligibilityDto['earnings'][number] }]> = [];

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
   * Filters the given client eligibilities to include only those clients who are enrolled and eligible. A client is
   * considered enrolled if their enrollment status code is equal to the enrolled status code defined in the server
   * configuration. A client is considered eligible if their earning is marked as eligible and has a defined coverage
   * copay tier code. The result is a map of client numbers to their corresponding eligibility information for those
   * clients who are enrolled and eligible.
   *
   * @param clientEligibilities The client eligibilities to filter.
   * @returns A map of client numbers to their corresponding eligibility information for those clients who are enrolled and eligible.
   */
  private getEnrolledAndEligibleClients(clientEligibilities: Awaited<ReturnType<typeof this.listClientEligibilities>>): Awaited<ReturnType<typeof this.listClientEligibilities>> {
    return new Map(
      [...clientEligibilities].filter(([clientNumber, eligibility]) => {
        const isEnrolled = eligibility.enrollmentStatusCode === this.serverConfig.ENROLLMENT_STATUS_CODE_ENROLLED;
        const isEligible = eligibility.earning.isEligible;
        const coverageCopayTierCode = eligibility.earning.coverageCopayTierCode;
        this.log.trace('Checking client number [%s] for enrollment and eligibility: isEnrolled=[%s], isEligible=[%s], coverageCopayTierCode=[%s]', clientNumber, isEnrolled, isEligible, coverageCopayTierCode);
        return isEnrolled && isEligible && coverageCopayTierCode !== undefined;
      }),
    );
  }

  /**
   * Determines the input model type for the given enrolled and eligible clients. If all clients have the same
   * coverage copay tier code, the input model type is 'simplified'. Otherwise, the input model type is 'full'.
   *
   * @param enrolledAndEligibleClients The enrolled and eligible clients for which to determine the input model type.
   * @returns The input model type for the given enrolled and eligible clients.
   */
  private getInputModelForEnrolledAndEligibleClients(enrolledAndEligibleClients: Awaited<ReturnType<typeof this.getEnrolledAndEligibleClients>>): 'simplified' | 'full' {
    const copayTierCodes = new Set([...enrolledAndEligibleClients.values()].map((eligibility) => eligibility.earning.coverageCopayTierCode));
    return copayTierCodes.size === 1 ? 'simplified' : 'full';
  }
}
