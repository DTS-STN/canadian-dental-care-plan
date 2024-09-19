import { error } from 'console';
import { Container } from 'inversify';
import { makeLoggerMiddleware, textSerializer } from 'inversify-logger-middleware';

import type { ClientConfig } from '~/.server/configs/client.config';
import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { ClientFriendlyStatusDtoMapper } from '~/.server/domain/mappers/client-friendly-status.dto.mapper';
import { ClientFriendlyStatusDtoMapperImpl } from '~/.server/domain/mappers/client-friendly-status.dto.mapper';
import type { CountryDtoMapper } from '~/.server/domain/mappers/country.dto.mapper';
import { CountryDtoMapperImpl } from '~/.server/domain/mappers/country.dto.mapper';
import type { FederalGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers/federal-government-insurance-plan.dto.mapper';
import { FederalGovernmentInsurancePlanDtoMapperImpl } from '~/.server/domain/mappers/federal-government-insurance-plan.dto.mapper';
import type { MaritalStatusDtoMapper } from '~/.server/domain/mappers/marital-status.dto.mapper';
import { MaritalStatusDtoMapperImpl } from '~/.server/domain/mappers/marital-status.dto.mapper';
import type { PreferredCommunicationMethodDtoMapper } from '~/.server/domain/mappers/preferred-communication-method.dto.mapper';
import { PreferredCommunicationMethodDtoMapperImpl } from '~/.server/domain/mappers/preferred-communication-method.dto.mapper';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers/preferred-language.dto.mapper';
import { PreferredLanguageDtoMapperImpl } from '~/.server/domain/mappers/preferred-language.dto.mapper';
import type { ProvinceTerritoryStateDtoMapper } from '~/.server/domain/mappers/province-territory-state.dto.mapper';
import { ProvinceTerritoryStateDtoMapperImpl } from '~/.server/domain/mappers/province-territory-state.dto.mapper';
import type { ProvincialGovernmentInsurancePlanDtoMapper } from '~/.server/domain/mappers/provincial-government-insurance-plan.dto.mapper';
import { ProvincialGovernmentInsurancePlanDtoMapperImpl } from '~/.server/domain/mappers/provincial-government-insurance-plan.dto.mapper';
import type { ClientFriendlyStatusRepository } from '~/.server/domain/repositories/client-friendly-status.repository';
import { ClientFriendlyStatusRepositoryImpl } from '~/.server/domain/repositories/client-friendly-status.repository';
import type { CountryRepository } from '~/.server/domain/repositories/country.repository';
import { CountryRepositoryImpl } from '~/.server/domain/repositories/country.repository';
import type { FederalGovernmentInsurancePlanRepository } from '~/.server/domain/repositories/federal-government-insurance-plan.repository';
import { FederalGovernmentInsurancePlanRepositoryImpl } from '~/.server/domain/repositories/federal-government-insurance-plan.repository';
import type { MaritalStatusRepository } from '~/.server/domain/repositories/marital-status.repository';
import { MaritalStatusRepositoryImpl } from '~/.server/domain/repositories/marital-status.repository';
import type { PreferredCommunicationMethodRepository } from '~/.server/domain/repositories/preferred-communication-method.repository';
import { PreferredCommunicationMethodRepositoryImpl } from '~/.server/domain/repositories/preferred-communication-method.repository';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories/preferred-language.repository';
import { PreferredLanguageRepositoryImpl } from '~/.server/domain/repositories/preferred-language.repository';
import type { ProvinceTerritoryStateRepository } from '~/.server/domain/repositories/province-territory-state.repository';
import { ProvinceTerritoryStateRepositoryImpl } from '~/.server/domain/repositories/province-territory-state.repository';
import type { ProvincialGovernmentInsurancePlanRepository } from '~/.server/domain/repositories/provincial-government-insurance-plan.repository';
import { ProvincialGovernmentInsurancePlanRepositoryImpl } from '~/.server/domain/repositories/provincial-government-insurance-plan.repository';
import type { ClientFriendlyStatusService } from '~/.server/domain/services/client-friendly-status.service';
import { ClientFriendlyStatusServiceImpl } from '~/.server/domain/services/client-friendly-status.service';
import type { CountryService } from '~/.server/domain/services/country.service';
import { CountryServiceImpl } from '~/.server/domain/services/country.service';
import type { MaritalStatusService } from '~/.server/domain/services/marital-status.service';
import { MaritalStatusServiceImpl } from '~/.server/domain/services/marital-status.service';
import type { PreferredCommunicationMethodService } from '~/.server/domain/services/preferred-communication-method.service';
import { PreferredCommunicationMethodServiceImpl } from '~/.server/domain/services/preferred-communication-method.service';
import type { PreferredLanguageService } from '~/.server/domain/services/preferred-language.service';
import { PreferredLanguageServiceImpl } from '~/.server/domain/services/preferred-language.service';
import type { ProvinceTerritoryStateService } from '~/.server/domain/services/province-territory-state.service';
import { ProvinceTerritoryStateServiceImpl } from '~/.server/domain/services/province-territory-state.service';
import type { ProvincialGovernmentInsurancePlanService } from '~/.server/domain/services/provincial-government-insurance-plan.service';
import { ProvincialGovernmentInsurancePlanServiceImpl } from '~/.server/domain/services/provincial-government-insurance-plan.service';
import type { ConfigFactory } from '~/.server/factories/config.factory';
import { ConfigFactoryImpl } from '~/.server/factories/config.factory';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';
import { LogFactoryImpl } from '~/.server/factories/log.factory';
import { getLogger } from '~/utils/logging.server';

export function initContainer() {
  const log = getLogger('container.init');

  const container = new Container({ defaultScope: 'Singleton' });
  log.info('Initializing IoC container; id: [%s], options: [%j]', container.id, container.options);

  // configure factories
  container.bind<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).to(ConfigFactoryImpl);
  container.bind<LogFactory>(SERVICE_IDENTIFIER.LOG_FACTORY).to(LogFactoryImpl);

  // configue configs
  container.bind<ClientConfig>(SERVICE_IDENTIFIER.CLIENT_CONFIG).toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createClientConfig());
  container.bind<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG).toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createServerConfig());

  // configure repositories
  container.bind<ClientFriendlyStatusRepository>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_REPOSITORY).to(ClientFriendlyStatusRepositoryImpl);
  container.bind<CountryRepository>(SERVICE_IDENTIFIER.COUNTRY_REPOSITORY).to(CountryRepositoryImpl);
  container.bind<FederalGovernmentInsurancePlanRepository>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(FederalGovernmentInsurancePlanRepositoryImpl);
  container.bind<MaritalStatusRepository>(SERVICE_IDENTIFIER.MARITAL_STATUS_REPOSITORY).to(MaritalStatusRepositoryImpl);
  container.bind<PreferredCommunicationMethodRepository>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_REPOSITORY).to(PreferredCommunicationMethodRepositoryImpl);
  container.bind<PreferredLanguageRepository>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_REPOSITORY).to(PreferredLanguageRepositoryImpl);
  container.bind<ProvinceTerritoryStateRepository>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_REPOSITORY).to(ProvinceTerritoryStateRepositoryImpl);
  container.bind<ProvincialGovernmentInsurancePlanRepository>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_REPOSITORY).to(ProvincialGovernmentInsurancePlanRepositoryImpl);

  // configure mappers
  container.bind<ClientFriendlyStatusDtoMapper>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_DTO_MAPPER).to(ClientFriendlyStatusDtoMapperImpl);
  container.bind<CountryDtoMapper>(SERVICE_IDENTIFIER.COUNTRY_DTO_MAPPER).to(CountryDtoMapperImpl);
  container.bind<FederalGovernmentInsurancePlanDtoMapper>(SERVICE_IDENTIFIER.FEDERAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(FederalGovernmentInsurancePlanDtoMapperImpl);
  container.bind<MaritalStatusDtoMapper>(SERVICE_IDENTIFIER.MARITAL_STATUS_DTO_MAPPER).to(MaritalStatusDtoMapperImpl);
  container.bind<PreferredCommunicationMethodDtoMapper>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_DTO_MAPPER).to(PreferredCommunicationMethodDtoMapperImpl);
  container.bind<PreferredLanguageDtoMapper>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_DTO_MAPPER).to(PreferredLanguageDtoMapperImpl);
  container.bind<ProvinceTerritoryStateDtoMapper>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_DTO_MAPPER).to(ProvinceTerritoryStateDtoMapperImpl);
  container.bind<ProvincialGovernmentInsurancePlanDtoMapper>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_DTO_MAPPER).to(ProvincialGovernmentInsurancePlanDtoMapperImpl);

  //configure services
  container.bind<ClientFriendlyStatusService>(SERVICE_IDENTIFIER.CLIENT_FRIENDLY_STATUS_SERVICE).to(ClientFriendlyStatusServiceImpl);
  container.bind<CountryService>(SERVICE_IDENTIFIER.COUNTRY_SERVICE).to(CountryServiceImpl);
  container.bind<MaritalStatusService>(SERVICE_IDENTIFIER.MARITAL_STATUS_SERVICE).to(MaritalStatusServiceImpl);
  container.bind<PreferredCommunicationMethodService>(SERVICE_IDENTIFIER.PREFERRED_COMMUNICATION_METHOD_SERVICE).to(PreferredCommunicationMethodServiceImpl);
  container.bind<PreferredLanguageService>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE).to(PreferredLanguageServiceImpl);
  container.bind<ProvinceTerritoryStateService>(SERVICE_IDENTIFIER.PROVINCE_TERRITORY_STATE_SERVICE).to(ProvinceTerritoryStateServiceImpl);
  container.bind<ProvincialGovernmentInsurancePlanService>(SERVICE_IDENTIFIER.PROVINCIAL_GOVERNMENT_INSURANCE_PLAN_SERVICE).to(ProvincialGovernmentInsurancePlanServiceImpl);

  // configure container logger middleware
  const serverConfig = container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);

  if (serverConfig.NODE_ENV === 'development') {
    container.applyMiddleware(createLoggerMidddlware(log));
  }

  log.info('IoC container initialized; id: [%s]', container.id);

  return container;
}

function createLoggerMidddlware(log: Logger) {
  return makeLoggerMiddleware(
    {
      request: {
        bindings: { activated: true, implementationType: true, scope: true, serviceIdentifier: true, type: true },
        serviceIdentifier: true,
        target: { metadata: true, name: true, serviceIdentifier: true },
      },
      time: true,
    },
    (out) => {
      if (out.error) {
        log.error(error);
        return;
      }

      log.debug(textSerializer(out));
    },
  );
}
