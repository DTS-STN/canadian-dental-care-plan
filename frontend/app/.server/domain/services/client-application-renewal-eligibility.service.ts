import { inject, injectable } from 'inversify';
import type { Option } from 'oxide.ts';

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
   * Finds a client application renewal eligibility by basic info.
   *
   * @param clientApplicationBasicInfoRequestDto The basic info request dto.
   * @returns A Promise that resolves to client application renewal eligibility dto if found, otherwise None.
   */
  findClientApplicationRenewalEligibilityByBasicInfo(clientApplicationRenewalEligibilityBasicInfoRequestDto: ClientApplicationRenewalEligibilityBasicInfoRequestDto): Promise<Option<ClientApplicationRenewalEligibilityDto>>;

  /**
   * Finds a client application renewal eligibility by basic info and SIN.
   *
   * @param clientApplicationBasicInfoAndSinRequestDto The basic info and SIN request dto.
   * @returns A Promise that resolves to client application renewal eligibility dto if found, otherwise None.
   */
  findClientApplicationRenewalEligibilityByBasicInfoAndSin(clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto: ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto): Promise<Option<ClientApplicationRenewalEligibilityDto>>;

  /**
   * Finds a client application renewal eligibility by SIN.
   *
   * @param clientApplicationSinRequestDto The SIN request dto.
   * @returns A Promise that resolves to client application renewal eligibility dto if found, otherwise None.
   */
  findClientApplicationRenewalEligibilityBySin(clientApplicationRenewalEligibilitySinRequestDto: ClientApplicationRenewalEligibilitySinRequestDto): Promise<Option<ClientApplicationRenewalEligibilityDto>>;
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
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultClientApplicationRenewalEligibilityService initiated.');
  }

  async findClientApplicationRenewalEligibilityByBasicInfo(clientApplicationRenewalEligibilityBasicInfoRequestDto: ClientApplicationRenewalEligibilityBasicInfoRequestDto): Promise<Option<ClientApplicationRenewalEligibilityDto>> {
    this.log.trace('Get client application renewal eligibility by basic info: [%j]', clientApplicationRenewalEligibilityBasicInfoRequestDto);
    this.auditService.createAudit('client-application-renewal-eligibility.basic-info.get', { userId: clientApplicationRenewalEligibilityBasicInfoRequestDto.userId });
    const clientApplicationDto = await this.clientApplicationService.findClientApplicationByBasicInfo(clientApplicationRenewalEligibilityBasicInfoRequestDto);
    const clientApplicationRenewalEligibilityDto = this.clientApplicationRenewalEligibilityDtoMapper.mapToClientApplicationRenewalEligibilityDto(clientApplicationDto);
    this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
    return clientApplicationRenewalEligibilityDto;
  }

  async findClientApplicationRenewalEligibilityByBasicInfoAndSin(clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto: ClientApplicationRenewalEligibilityBasicInfoAndSinRequestDto): Promise<Option<ClientApplicationRenewalEligibilityDto>> {
    this.log.trace('Get client application renewal eligibility with basic info and sin: [%j]', clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto);
    this.auditService.createAudit('client-application-renewal-eligibility.basic-info-and-sin.get', { userId: clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto.userId });
    const clientApplicationDto = await this.clientApplicationService.findClientApplicationByBasicInfoAndSin(clientApplicationRenewalEligibilityBasicInfoAndSinRequestDto);
    const clientApplicationRenewalEligibilityDto = this.clientApplicationRenewalEligibilityDtoMapper.mapToClientApplicationRenewalEligibilityDto(clientApplicationDto);
    this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
    return clientApplicationRenewalEligibilityDto;
  }

  async findClientApplicationRenewalEligibilityBySin(clientApplicationRenewalEligibilitySinRequestDto: ClientApplicationRenewalEligibilitySinRequestDto): Promise<Option<ClientApplicationRenewalEligibilityDto>> {
    this.log.trace('Get client application renewal eligibility with sin: [%j]', clientApplicationRenewalEligibilitySinRequestDto);
    this.auditService.createAudit('client-application-renewal-eligibility.sin.get', { userId: clientApplicationRenewalEligibilitySinRequestDto.userId });
    const clientApplicationDto = await this.clientApplicationService.findClientApplicationBySin(clientApplicationRenewalEligibilitySinRequestDto);
    const clientApplicationRenewalEligibilityDto = this.clientApplicationRenewalEligibilityDtoMapper.mapToClientApplicationRenewalEligibilityDto(clientApplicationDto);
    this.log.trace('Returning client application renewal eligibility: [%j]', clientApplicationRenewalEligibilityDto);
    return clientApplicationRenewalEligibilityDto;
  }
}
