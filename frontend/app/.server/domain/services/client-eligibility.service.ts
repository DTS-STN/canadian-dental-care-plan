import { inject, injectable } from 'inversify';
import { memoize } from 'micro-memoize';
import type { Memoized, Options } from 'micro-memoize';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { ClientEligibilityDto, ClientEligibilityRequestDto } from '~/.server/domain/dtos';
import type { ClientEligibilityDtoMapper } from '~/.server/domain/mappers';
import type { ClientEligibilityRepository } from '~/.server/domain/repositories';
import type { AuditService } from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import { secondsToMilliseconds } from '~/utils/units.utils';

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

  /**
   * Lists client eligibilities by client numbers and taxation year.
   *
   * @param clientNumbers The array of client numbers.
   * @param taxationYear The taxation year.
   * @returns A Promise that resolves to a readonly map of client numbers to their client eligibility dto.
   */
  listClientEligibilityByClientNumbersAndTaxationYear(clientNumbers: ReadonlyArray<string>, taxationYear: number): Promise<ReadonlyMap<string, ClientEligibilityDto>>;
}

@injectable()
export class DefaultClientEligibilityService implements ClientEligibilityService {
  private readonly log: Logger;
  private readonly clientEligibilityDtoMapper: ClientEligibilityDtoMapper;
  private readonly clientEligibilityRepository: ClientEligibilityRepository;
  private readonly auditService: AuditService;
  private readonly serverConfig: Pick<ServerConfig, 'ELIGIBILITY_STATUS_CODE_ELIGIBLE' | 'LOOKUP_SVC_CLIENT_ELIGIBILITY_CACHE_TTL_SECONDS'>;

  constructor(
    @inject(TYPES.ClientEligibilityDtoMapper) clientEligibilityDtoMapper: ClientEligibilityDtoMapper,
    @inject(TYPES.ClientEligibilityRepository) clientEligibilityRepository: ClientEligibilityRepository,
    @inject(TYPES.AuditService) auditService: AuditService,
    @inject(TYPES.ServerConfig) serverConfig: Pick<ServerConfig, 'ELIGIBILITY_STATUS_CODE_ELIGIBLE' | 'LOOKUP_SVC_CLIENT_ELIGIBILITY_CACHE_TTL_SECONDS'>,
  ) {
    this.log = createLogger('DefaultClientEligibilityService');
    this.clientEligibilityDtoMapper = clientEligibilityDtoMapper;
    this.clientEligibilityRepository = clientEligibilityRepository;
    this.auditService = auditService;
    this.serverConfig = serverConfig;

    this.init();
  }

  private init(): void {
    const clientEligibilityCacheTtl = secondsToMilliseconds(this.serverConfig.LOOKUP_SVC_CLIENT_ELIGIBILITY_CACHE_TTL_SECONDS);
    this.log.debug('Cache TTL value: %d ms', clientEligibilityCacheTtl);

    this.listClientEligibilitiesByClientNumbers = memoize(this.listClientEligibilitiesByClientNumbers, {
      async: true,
      expires: clientEligibilityCacheTtl,
      maxSize: Infinity,
    });

    type MemoizedListClientEligibilitiesByClientNumbers = Memoized<typeof this.listClientEligibilitiesByClientNumbers, Options<typeof this.listClientEligibilitiesByClientNumbers>>;
    (this.listClientEligibilitiesByClientNumbers as MemoizedListClientEligibilitiesByClientNumbers).cache.on('add', ({ key }) => {
      this.log.info('Creating new listClientEligibilitiesByClientNumbers memo');
    });

    this.log.debug('DefaultClientEligibilityService initiated.');
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

  async listClientEligibilityByClientNumbersAndTaxationYear(clientNumbers: ReadonlyArray<string>, taxationYear: number): Promise<ReadonlyMap<string, ClientEligibilityDto>> {
    this.log.trace('Get client eligibility status for client numbers: [%j] and taxation year: [%d]', clientNumbers, taxationYear);

    this.auditService.createAudit('client-eligibility_by-client-number-and-taxation-year.get');

    const clientEligibilityRequestDtos = clientNumbers.map((clientNumber) => ({ clientNumber }));
    const clientEligibilities = await this.listClientEligibilitiesByClientNumbers(clientEligibilityRequestDtos);
    return new Map(clientEligibilities.map((eligibility) => [eligibility.clientNumber, eligibility]));
  }
}
