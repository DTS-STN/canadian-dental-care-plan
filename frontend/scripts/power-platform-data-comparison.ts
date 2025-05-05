import chalk from 'chalk';
import { diff, diffString } from 'json-diff';
import ora from 'ora';

import type {
  ClientFriendlyStatusDto,
  CountryDto,
  FederalGovernmentInsurancePlanDto,
  LetterTypeDto,
  MaritalStatusDto,
  PreferredCommunicationMethodDto,
  PreferredLanguageDto,
  ProvinceTerritoryStateDto,
  ProvincialGovernmentInsurancePlanDto,
} from '~/.server/domain/dtos';
import {
  DefaultClientFriendlyStatusDtoMapper,
  DefaultCountryDtoMapper,
  DefaultFederalGovernmentInsurancePlanDtoMapper,
  DefaultLetterTypeDtoMapper,
  DefaultMaritalStatusDtoMapper,
  DefaultPreferredCommunicationMethodDtoMapper,
  DefaultPreferredLanguageDtoMapper,
  DefaultProvinceTerritoryStateDtoMapper,
  DefaultProvincialGovernmentInsurancePlanDtoMapper,
} from '~/.server/domain/mappers';
import {
  DefaultClientFriendlyStatusRepository,
  DefaultCountryRepository,
  DefaultFederalGovernmentInsurancePlanRepository,
  DefaultLetterTypeRepository,
  DefaultMaritalStatusRepository,
  DefaultPreferredCommunicationMethodRepository,
  DefaultPreferredLanguageRepository,
  DefaultProvinceTerritoryStateRepository,
  DefaultProvincialGovernmentInsurancePlanRepository,
} from '~/.server/domain/repositories';
import {
  DefaultCountryService,
  DefaultFederalGovernmentInsurancePlanService,
  DefaultLetterTypeService,
  DefaultMaritalStatusService,
  DefaultPreferredCommunicationMethodService,
  DefaultPreferredLanguageService,
  DefaultProvinceTerritoryStateService,
  DefaultProvincialGovernmentInsurancePlanService,
} from '~/.server/domain/services';
import cctlettertypesJson from '~/.server/resources/power-platform-new/esdc_cctlettertypes.json';
import clientfriendlystatusesJson from '~/.server/resources/power-platform-new/esdc_clientfriendlystatuses.json';
import countriesJson from '~/.server/resources/power-platform-new/esdc_countries.json';
import governmentinsuranceplans_federalJson from '~/.server/resources/power-platform-new/esdc_governmentinsuranceplans_federal.json';
import governmentinsuranceplans_provincialJson from '~/.server/resources/power-platform-new/esdc_governmentinsuranceplans_provincial.json';
import maritalstatusJson from '~/.server/resources/power-platform-new/esdc_maritalstatus.json';
import preferredlanguageJson from '~/.server/resources/power-platform-new/esdc_preferredlanguage.json';
import preferredmethodofcommunicationJson from '~/.server/resources/power-platform-new/esdc_preferredmethodofcommunication.json';
import provinceterritorystatesJson from '~/.server/resources/power-platform-new/esdc_provinceterritorystates.json';
import { getEnv } from '~/.server/utils/env.utils';

const serverConfig = getEnv();

interface ComparedData extends Record<string, string> {
  id: string;
}

function compareData<T extends Readonly<ComparedData>>({
  name,
  currentDataFn,
  newDataFn,
}: {
  name: string; //
  currentDataFn: () => readonly T[];
  newDataFn: () => T[];
}) {
  // Add a newline for separation between comparisons
  console.log('');
  const spinner = ora(`Comparing ${chalk.blue(name)}...`).start();

  try {
    const currentData = currentDataFn();
    const newData = newDataFn();

    // Sort data for consistent comparison
    const sortedOldData = currentData.toSorted((a, b) => a.id.localeCompare(b.id));
    const sortedNewData = newData.toSorted((a, b) => a.id.localeCompare(b.id));

    // Perform the diff
    // Set full: true in options for a more detailed diff if needed, default is fine too.
    const diffResult = diff(sortedOldData, sortedNewData, { outputKeys: ['id'] });

    if (Array.isArray(diffResult) === false) {
      // No differences found
      spinner.succeed(chalk.green(`${name}: No differences found.`));
    } else {
      // Differences found
      spinner.warn(chalk.yellow(`${name}: Differences found:`));
      const ids = diffResult.filter(([result]) => result !== ' ').map(([_, { id }]) => id);
      console.log(
        diffString(
          sortedOldData.filter(({ id }) => ids.includes(id)), //
          sortedNewData.filter(({ id }) => ids.includes(id)),
          { outputKeys: ['id'] },
        ),
      );
    }
  } catch (error) {
    // Handle errors during data fetching or comparison
    spinner.fail(chalk.red(`${name}: Comparison failed!`));
    console.error(chalk.red('Error details:'), error);
  }
}

compareData<ClientFriendlyStatusDto>({
  name: 'Client friendly statuses',
  currentDataFn: () => {
    const clientFriendlyStatusMapper = new DefaultClientFriendlyStatusDtoMapper();
    const clientFriendlyStatusRepo = new DefaultClientFriendlyStatusRepository();
    return clientFriendlyStatusRepo.listAllClientFriendlyStatuses().map((entity) => clientFriendlyStatusMapper.mapClientFriendlyStatusEntityToClientFriendlyStatusDto(entity));
  },
  newDataFn: () => {
    return clientfriendlystatusesJson.map((data) => ({
      id: data.id,
      nameEn: data.descriptionEn,
      nameFr: data.descriptionFr,
    }));
  },
});

compareData<LetterTypeDto>({
  name: 'Letter types',
  currentDataFn: () => {
    const letterTypeMapper = new DefaultLetterTypeDtoMapper(serverConfig);
    const letterTypeRepo = new DefaultLetterTypeRepository();
    return new DefaultLetterTypeService(letterTypeMapper, letterTypeRepo, serverConfig).listLetterTypes();
  },
  newDataFn: () => {
    return cctlettertypesJson.map((data) => ({
      id: data.id,
      nameEn: [data.parentNameEn, data.nameEn].filter(Boolean).join(' - '),
      nameFr: [data.parentNameFr, data.nameFr].filter(Boolean).join(' - '),
    }));
  },
});

compareData<CountryDto>({
  name: 'Countries',
  currentDataFn: () => {
    const countryMapper = new DefaultCountryDtoMapper();
    const countryRepo = new DefaultCountryRepository();
    return new DefaultCountryService(countryMapper, countryRepo, serverConfig).listCountries();
  },
  newDataFn: () => {
    return countriesJson.map((data) => ({
      id: data.id,
      nameEn: data.nameEn,
      nameFr: data.nameFr,
    }));
  },
});

compareData<FederalGovernmentInsurancePlanDto>({
  name: 'Government insurance plans - federal',
  currentDataFn: () => {
    const federalGovernmentInsurancePlanMapper = new DefaultFederalGovernmentInsurancePlanDtoMapper();
    const federalGovernmentInsurancePlanRepo = new DefaultFederalGovernmentInsurancePlanRepository();
    return new DefaultFederalGovernmentInsurancePlanService(federalGovernmentInsurancePlanMapper, federalGovernmentInsurancePlanRepo, serverConfig).listFederalGovernmentInsurancePlans();
  },
  newDataFn: () => {
    return governmentinsuranceplans_federalJson.map((data) => ({
      id: data.id,
      nameEn: data.nameEn,
      nameFr: data.nameFr,
    }));
  },
});

compareData<ProvincialGovernmentInsurancePlanDto>({
  name: 'Government insurance plans - provincial',
  currentDataFn: () => {
    const provincialGovernmentInsurancePlanMapper = new DefaultProvincialGovernmentInsurancePlanDtoMapper();
    const provincialGovernmentInsurancePlanRepo = new DefaultProvincialGovernmentInsurancePlanRepository();
    return new DefaultProvincialGovernmentInsurancePlanService(provincialGovernmentInsurancePlanMapper, provincialGovernmentInsurancePlanRepo, serverConfig).listProvincialGovernmentInsurancePlans();
  },
  newDataFn: () => {
    return governmentinsuranceplans_provincialJson.map<ProvincialGovernmentInsurancePlanDto>((data) => ({
      id: data.id,
      provinceTerritoryStateId: data.provinceTerritoryStateId,
      nameEn: data.nameEn,
      nameFr: data.nameFr,
    }));
  },
});

compareData<MaritalStatusDto>({
  name: 'Marital statuses',
  currentDataFn: () => {
    const maritalStatusMapper = new DefaultMaritalStatusDtoMapper(serverConfig);
    const maritalStatusRepo = new DefaultMaritalStatusRepository();
    return new DefaultMaritalStatusService(maritalStatusMapper, maritalStatusRepo, serverConfig).listMaritalStatuses();
  },
  newDataFn: () => {
    return maritalstatusJson.map((data) => ({
      id: data.id.toString(),
      nameEn: data.labelEn,
      nameFr: data.labelFr,
    }));
  },
});

compareData<PreferredLanguageDto>({
  name: 'Preferred languages',
  currentDataFn: () => {
    const preferredLanguageMapper = new DefaultPreferredLanguageDtoMapper(serverConfig);
    const preferredLanguageRepo = new DefaultPreferredLanguageRepository();
    return new DefaultPreferredLanguageService(preferredLanguageMapper, preferredLanguageRepo, serverConfig).listPreferredLanguages();
  },
  newDataFn: () => {
    return preferredlanguageJson.map((data) => ({
      id: data.id.toString(),
      nameEn: data.labelEn,
      nameFr: data.labelFr,
    }));
  },
});

compareData<PreferredCommunicationMethodDto>({
  name: 'Preferred communication methods',
  currentDataFn: () => {
    const preferredCommunicationMethodMapper = new DefaultPreferredCommunicationMethodDtoMapper(serverConfig);
    const preferredCommunicationMethodRepo = new DefaultPreferredCommunicationMethodRepository();
    return new DefaultPreferredCommunicationMethodService(preferredCommunicationMethodMapper, preferredCommunicationMethodRepo, serverConfig).listPreferredCommunicationMethods();
  },
  newDataFn: () => {
    return preferredmethodofcommunicationJson.map((data) => ({
      id: data.id.toString(),
      nameEn: data.labelEn,
      nameFr: data.labelFr,
    }));
  },
});

compareData<ProvinceTerritoryStateDto>({
  name: 'Province territory states',
  currentDataFn: () => {
    const provinceTerritoryStateMapper = new DefaultProvinceTerritoryStateDtoMapper();
    const provinceTerritoryStateRepo = new DefaultProvinceTerritoryStateRepository();
    return new DefaultProvinceTerritoryStateService(provinceTerritoryStateMapper, provinceTerritoryStateRepo, serverConfig).listProvinceTerritoryStates();
  },
  newDataFn: () => {
    return provinceterritorystatesJson.map((data) => ({
      id: data.id,
      abbr: data.aplhaCode,
      countryId: data.countryId,
      nameEn: data.nameEn,
      nameFr: data.nameFr,
    }));
  },
});
