import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto, ClientApplicationRenewalEligibilityDto, ClientApplicationRenewalEligibilitySinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationRenewalEligibilityDtoMapper } from '~/.server/domain/mappers';
import type { ApplicantService, AuditService, ClientApplicationService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * A service that provides access to client application data for renewal eligibility.
 */
export interface ClientApplicationRenewalEligibilityService {
  /**
   * Gets a client application renewal eligibility by basic info and SIN.
   *
   * @param clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto The basic info and SIN request dto.
   * @returns A Promise that resolves to client application renewal eligibility dto.
   */
  getClientApplicationRenewalEligibilityByBasicInfoAndSin(clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto: ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto): Promise<ClientApplicationRenewalEligibilityDto>;

  /**
   * Gets a client application renewal eligibility by SIN.
   *
   * @param clientApplicationRenewalEligibilitySinRequestDto The SIN request dto.
   * @returns A Promise that resolves to client application renewal eligibility dto.
   */
  getClientApplicationRenewalEligibilityBySin(clientApplicationRenewalEligibilitySinRequestDto: ClientApplicationRenewalEligibilitySinRequestDto): Promise<ClientApplicationRenewalEligibilityDto>;
}

@injectable()
export class DefaultClientApplicationRenewalEligibilityService implements ClientApplicationRenewalEligibilityService {
  private readonly log: Logger;
  private readonly applicantService: ApplicantService;
  private readonly clientApplicationRenewalEligibilityDtoMapper: ClientApplicationRenewalEligibilityDtoMapper;
  private readonly clientApplicationService: ClientApplicationService;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.ApplicantService) applicantService: ApplicantService,
    @inject(TYPES.ClientApplicationRenewalEligibilityDtoMapper) clientApplicationRenewalEligibilityDtoMapper: ClientApplicationRenewalEligibilityDtoMapper,
    @inject(TYPES.ClientApplicationService) clientApplicationService: ClientApplicationService,
    @inject(TYPES.AuditService) auditService: AuditService,
  ) {
    this.log = createLogger('DefaultClientApplicationRenewalEligibilityService');
    this.applicantService = applicantService;
    this.clientApplicationService = clientApplicationService;
    this.clientApplicationRenewalEligibilityDtoMapper = clientApplicationRenewalEligibilityDtoMapper;
    this.auditService = auditService;
    this.log.debug('DefaultClientApplicationRenewalEligibilityService initiated.');
  }

  async getClientApplicationRenewalEligibilityByBasicInfoAndSin(clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto: ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Get client application renewal eligibility with basic info and sin: [%j]', clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto);

    const clientApplicationDto = await this.clientApplicationService.findClientApplicationByBasicInfoAndSin({
      clientNumber: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.clientNumber,
      dateOfBirth: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.dateOfBirth,
      firstName: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.firstName,
      lastName: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.lastName,
      applicationYearId: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.applicationYearId,
      sin: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.sin,
      userId: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.userId,
    });

    this.auditService.createAudit('client-application-renewal-eligibility.basic-info-and-sin.get', { userId: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.userId });

    if (clientApplicationDto.isSome()) {
      const clientApplicationRenewalEligibilityDto = await this.clientApplicationRenewalEligibilityDtoMapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(clientApplicationDto.unwrap());

      this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
      return clientApplicationRenewalEligibilityDto;
    }

    // TODO: Check if an applicant exists with the provided basic info and SIN to return a more specific result (e.g., 'INELIGIBLE-APPLICANT-NOT-FOUND') instead of 'INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND'.
    this.log.debug('Client application dto is None, returning not found result');
    return { result: 'INELIGIBLE-CLIENT-APPLICATION-NOT-FOUND' };
  }

  async getClientApplicationRenewalEligibilityBySin(clientApplicationRenewalEligibilitySinRequestDto: ClientApplicationRenewalEligibilitySinRequestDto): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Get client application renewal eligibility with sin: [%j]', clientApplicationRenewalEligibilitySinRequestDto);

    const clientApplicationDto = await this.clientApplicationService.findClientApplicationBySin({
      sin: clientApplicationRenewalEligibilitySinRequestDto.sin,
      applicationYearId: clientApplicationRenewalEligibilitySinRequestDto.applicationYearId,
      userId: clientApplicationRenewalEligibilitySinRequestDto.userId,
    });

    this.auditService.createAudit('client-application-renewal-eligibility.sin.get', { userId: clientApplicationRenewalEligibilitySinRequestDto.userId });

    if (clientApplicationDto.isSome()) {
      const clientApplicationRenewalEligibilityDto = await this.clientApplicationRenewalEligibilityDtoMapper.mapClientApplicationDtoToClientApplicationRenewalEligibilityDto(clientApplicationDto.unwrap());

      this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
      return clientApplicationRenewalEligibilityDto;
    }

    // If no client application is found with the provided SIN, we check if an applicant exists with that SIN
    const applicantOption = await this.applicantService.findApplicantBySin({
      sin: clientApplicationRenewalEligibilitySinRequestDto.sin,
      userId: clientApplicationRenewalEligibilitySinRequestDto.userId,
    });

    if (applicantOption.isNone()) {
      this.log.debug('Applicant is None for provided SIN, returning not found result');
      return { result: 'INELIGIBLE-APPLICANT-NOT-FOUND' };
    }

    const applicationYearId = clientApplicationRenewalEligibilitySinRequestDto.applicationYearId;
    const applicant = applicantOption.unwrap();
    this.log.debug('Applicant found for provided SIN, returning eligibility result based on applicant');
    this.log.trace('Applicant found for provided SIN: [%j], applicationYearId: [%s]', applicant, applicationYearId);
    return await this.clientApplicationRenewalEligibilityDtoMapper.mapApplicantDtoToClientApplicationRenewalEligibilityDto(applicant, applicationYearId);
  }
}
