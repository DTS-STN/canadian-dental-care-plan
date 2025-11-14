import { inject, injectable } from 'inversify';
import { None, Some } from 'oxide.ts';
import type { Option } from 'oxide.ts';

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
   * Finds a client eligibility by SIN.
   *
   * @param clientEligibilitySinRequestDto The SIN request dto.
   * @returns A Promise that resolves to the client eligibility dto if found, or `null` otherwise.
   */
  findClientEligibilityByClientNumbers(clientEligibilityRequestDto: ClientEligibilityRequestDto): Promise<Option<ReadonlyArray<ClientEligibilityDto>>>;
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
    this.init();
  }

  private init(): void {
    this.log.debug('DefaultClientEligibilityService initiated.');
  }

  async findClientEligibilityByClientNumbers(clientEligibilityRequestDto: ClientEligibilityRequestDto): Promise<Option<ReadonlyArray<ClientEligibilityDto>>> {
    this.log.trace('Get client eligibility with number: [%j]', clientEligibilityRequestDto);

    this.auditService.createAudit('client-eligibility.number.get');

    const clientEligibilityRequestEntity = this.clientEligibilityDtoMapper.mapClientEligibilityRequestDtoToClientEligibilityRequestEntity(clientEligibilityRequestDto);
    const clientEligibilityEntity = await this.clientEligibilityRepository.findClientEligibilityByClientNumbers(clientEligibilityRequestEntity);
    const clientEligibilityDto = clientEligibilityEntity.isSome() ? Some(clientEligibilityEntity.unwrap().map((entity) => this.clientEligibilityDtoMapper.mapClientEligibilityEntityToClientEligibilityDto(entity))) : None;

    this.log.trace('Returning client eligibility: [%j]', clientEligibilityDto);
    return clientEligibilityDto;
  }
}
