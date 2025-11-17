import { inject, injectable } from 'inversify';

import { TYPES } from '~/.server/constants';
import type { ClientEligibilityDto, ClientEligibilityRequestDto } from '~/.server/domain/dtos';
import type { ClientEligibilityDtoMapper } from '~/.server/domain/mappers';
import type { ClientEligibilityRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

/**
 * A service that provides access to client eligibility data.
 */
export interface ClientEligibilityService {
  /**
   * Lists client eligibilities by client numbers.
   *
   * @param clientEligibilityRequestDto The client eligibility request dto containing client numbers.
   * @returns A Promise that resolves to a readonly array of client eligibility dtos.
   */
  listClientEligibilitiesByClientNumbers(clientEligibilityRequestDto: ClientEligibilityRequestDto): Promise<ReadonlyArray<ClientEligibilityDto>>;
}

@injectable()
export class DefaultClientEligibilityService implements ClientEligibilityService {
  private readonly log: Logger;
  private readonly clientEligibilityDtoMapper: ClientEligibilityDtoMapper;
  private readonly clientEligibilityRepository: ClientEligibilityRepository;
  private readonly auditService: AuditService;

  constructor(
    @inject(TYPES.ClientEligibilityDtoMapper) clientEligibilityDtoMapper: ClientEligibilityDtoMapper,
    @inject(TYPES.ClientEligibilityRepository) clientEligibilityRepository: ClientEligibilityRepository,
    @inject(TYPES.AuditService) auditService: AuditService,
  ) {
    this.log = createLogger('DefaultClientEligibilityService');
    this.clientEligibilityDtoMapper = clientEligibilityDtoMapper;
    this.clientEligibilityRepository = clientEligibilityRepository;
    this.auditService = auditService;
  }

  async listClientEligibilitiesByClientNumbers(clientEligibilityRequestDto: ClientEligibilityRequestDto): Promise<ReadonlyArray<ClientEligibilityDto>> {
    this.log.trace('Get client eligibility with number: [%j]', clientEligibilityRequestDto);

    this.auditService.createAudit('client-eligibility.number.get');

    const clientEligibilityRequestEntity = this.clientEligibilityDtoMapper.mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto);
    const clientEligibilityEntities = await this.clientEligibilityRepository.listClientEligibilitiesByClientNumbers(clientEligibilityRequestEntity);
    const clientEligibilityDtos = clientEligibilityEntities.map((entity) => this.clientEligibilityDtoMapper.mapClientEligibilityEntityToClientEligibilityDto(entity));

    this.log.trace('Returning client eligibility: [%j]', clientEligibilityDtos);
    return clientEligibilityDtos;
  }
}
