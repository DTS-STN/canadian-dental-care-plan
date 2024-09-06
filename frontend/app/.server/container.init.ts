import { error } from 'console';
import { Container } from 'inversify';
import { makeLoggerMiddleware, textSerializer } from 'inversify-logger-middleware';

import type { ClientConfig } from '~/.server/configs/client.config';
import type { ServerConfig } from '~/.server/configs/server.config';
import { SERVICE_IDENTIFIER } from '~/.server/constants/service-identifier.contant';
import type { PreferredLanguageDtoMapper } from '~/.server/domain/mappers/preferred-language.dto.mapper';
import { PreferredLanguageDtoMapperImpl } from '~/.server/domain/mappers/preferred-language.dto.mapper';
import type { PreferredLanguageRepository } from '~/.server/domain/repositories/preferred-language.repository';
import { PreferredLanguageRepositoryImpl } from '~/.server/domain/repositories/preferred-language.repository';
import type { PreferredLanguageService } from '~/.server/domain/services/preferred-language.service';
import { PreferredLanguageServiceImpl } from '~/.server/domain/services/preferred-language.service';
import type { ConfigFactory } from '~/.server/factories/config.factory';
import { ConfigFactoryImpl } from '~/.server/factories/config.factory';
import type { LogFactory, Logger } from '~/.server/factories/log.factory';
import { LogFactoryImpl } from '~/.server/factories/log.factory';
import type { ContainerConfigProvider } from '~/.server/providers/container-config.provider';
import { ContainerConfigProviderImpl } from '~/.server/providers/container-config.provider';
import type { ContainerServiceProvider } from '~/.server/providers/container-service.provider';
import { ContainerServiceProviderImpl } from '~/.server/providers/container-service.provider';
import type { ContainerProvider } from '~/.server/providers/container.provider';
import { ContainerProviderImpl } from '~/.server/providers/container.provider';
import { getLogger } from '~/utils/logging.server';

export function initContainer() {
  const log = getLogger('ioc.config');
  log.info('Initializing IoC container');

  const container = new Container();

  // configure factories
  container.bind<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).to(ConfigFactoryImpl).inSingletonScope();
  container.bind<LogFactory>(SERVICE_IDENTIFIER.LOG_FACTORY).to(LogFactoryImpl).inSingletonScope();

  // configure providers
  container.bind<ContainerConfigProvider>(SERVICE_IDENTIFIER.CONTAINER_CONFIG_PROVIDER).to(ContainerConfigProviderImpl).inSingletonScope();
  container.bind<ContainerProvider>(SERVICE_IDENTIFIER.CONTAINER_PROVIDER).to(ContainerProviderImpl).inSingletonScope();
  container.bind<ContainerServiceProvider>(SERVICE_IDENTIFIER.CONTAINER_SERVICE_PROVIDER).to(ContainerServiceProviderImpl).inSingletonScope();

  // configue configs
  container
    .bind<ClientConfig>(SERVICE_IDENTIFIER.CLIENT_CONFIG)
    .toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createClientConfig())
    .inSingletonScope();
  container
    .bind<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG)
    .toDynamicValue((context) => context.container.get<ConfigFactory>(SERVICE_IDENTIFIER.CONFIG_FACTORY).createServerConfig())
    .inSingletonScope();

  // configure repositories
  container.bind<PreferredLanguageRepository>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_REPOSITORY).to(PreferredLanguageRepositoryImpl).inSingletonScope();

  // configure mappers
  container.bind<PreferredLanguageDtoMapper>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_DTO_MAPPER).to(PreferredLanguageDtoMapperImpl).inSingletonScope();

  //configure services
  container.bind<PreferredLanguageService>(SERVICE_IDENTIFIER.PREFERRED_LANGUAGE_SERVICE).to(PreferredLanguageServiceImpl).inSingletonScope();

  // configure container logger middleware
  const serverConfig = container.get<ServerConfig>(SERVICE_IDENTIFIER.SERVER_CONFIG);

  if (serverConfig.NODE_ENV === 'development') {
    container.applyMiddleware(createLoggerMidddlware(log));
  }

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
