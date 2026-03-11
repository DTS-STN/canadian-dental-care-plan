import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto, ClientApplicationRenewalEligibilityBasicInfoRequestDto, ClientApplicationRenewalEligibilityDto, ClientApplicationRenewalEligibilitySinRequestDto } from '~/.server/domain/dtos';
import type { ClientApplicationRenewalEligibilityDtoMapper } from '~/.server/domain/mappers';
import type { AuditService, ClientApplicationService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * A service that provides access to client application data for renewal eligibility.
 */
export interface ClientApplicationRenewalEligibilityService {
  /**
   * Gets a client application renewal eligibility by basic info.
   *
   * @param clientApplicationRenewalEligibilityBasicInfoRequestDto The basic info request dto.
   * @returns A Promise that resolves to client application renewal eligibility dto.
   */
  getClientApplicationRenewalEligibilityByBasicInfo(clientApplicationRenewalEligibilityBasicInfoRequestDto: ClientApplicationRenewalEligibilityBasicInfoRequestDto): Promise<ClientApplicationRenewalEligibilityDto>;

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
  private readonly clientApplicationService: ClientApplicationService;
  private readonly clientApplicationRenewalEligibilityDtoMapper: ClientApplicationRenewalEligibilityDtoMapper;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.ClientApplicationService) clientApplicationService: ClientApplicationService,
    @inject(TYPES.ClientApplicationRenewalEligibilityDtoMapper) clientApplicationRenewalEligibilityDtoMapper: ClientApplicationRenewalEligibilityDtoMapper,
    @inject(TYPES.AuditService) auditService: AuditService,
  ) {
    this.log = createLogger('DefaultClientApplicationRenewalEligibilityService');
    this.clientApplicationService = clientApplicationService;
    this.clientApplicationRenewalEligibilityDtoMapper = clientApplicationRenewalEligibilityDtoMapper;
    this.auditService = auditService;
    this.log.debug('DefaultClientApplicationRenewalEligibilityService initiated.');
  }

  async getClientApplicationRenewalEligibilityByBasicInfo(clientApplicationRenewalEligibilityBasicInfoRequestDto: ClientApplicationRenewalEligibilityBasicInfoRequestDto): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Get client application renewal eligibility by basic info: [%j]', clientApplicationRenewalEligibilityBasicInfoRequestDto);
    const clientApplicationDto = await this.clientApplicationService.findClientApplicationByBasicInfo(clientApplicationRenewalEligibilityBasicInfoRequestDto);
    this.auditService.createAudit('client-application-renewal-eligibility.basic-info.get', { userId: clientApplicationRenewalEligibilityBasicInfoRequestDto.userId });
    const clientApplicationRenewalEligibilityDto = await this.clientApplicationRenewalEligibilityDtoMapper.mapToClientApplicationRenewalEligibilityDto(clientApplicationDto);
    this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
    return clientApplicationRenewalEligibilityDto;
  }

  async getClientApplicationRenewalEligibilityByBasicInfoAndSin(clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto: ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Get client application renewal eligibility with basic info and sin: [%j]', clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto);
    const clientApplicationDto = await this.clientApplicationService.findClientApplicationByBasicInfoAndSin(clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto);
    this.auditService.createAudit('client-application-renewal-eligibility.basic-info-and-sin.get', { userId: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.userId });
    const clientApplicationRenewalEligibilityDto = await this.clientApplicationRenewalEligibilityDtoMapper.mapToClientApplicationRenewalEligibilityDto(clientApplicationDto);
    this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
    return clientApplicationRenewalEligibilityDto;
  }

  async getClientApplicationRenewalEligibilityBySin(clientApplicationRenewalEligibilitySinRequestDto: ClientApplicationRenewalEligibilitySinRequestDto): Promise<ClientApplicationRenewalEligibilityDto> {
    this.log.trace('Get client application renewal eligibility with sin: [%j]', clientApplicationRenewalEligibilitySinRequestDto);
    const clientApplicationDto = await this.clientApplicationService.findClientApplicationBySin(clientApplicationRenewalEligibilitySinRequestDto);
    this.auditService.createAudit('client-application-renewal-eligibility.sin.get', { userId: clientApplicationRenewalEligibilitySinRequestDto.userId });
    const clientApplicationRenewalEligibilityDto = await this.clientApplicationRenewalEligibilityDtoMapper.mapToClientApplicationRenewalEligibilityDto(clientApplicationDto);
    this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
    return clientApplicationRenewalEligibilityDto;
  }
}
