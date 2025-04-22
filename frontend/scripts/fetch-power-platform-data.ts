import checkbox from '@inquirer/checkbox';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs';
import jmespath from 'jmespath';
import ora from 'ora';
import type { Ora } from 'ora';
import path from 'path';
import prettier from 'prettier';
import { request } from 'undici';
import * as v from 'valibot';

// Define endpoints
interface Endpoint {
  name: string;
  description?: string;
  disabled?: boolean;
  outputFile: string;
  pathname: string;
  query?: Record<string, string>;
  jsonFilter?: string; // Optional JMESPath filter
}

const optionSetJsonFilter = `value[0] | OptionSet.Options[].{
    id: Value,
    labelEn: Label.LocalizedLabels[?LanguageCode==\`1033\`].Label | [0],
    labelFr: Label.LocalizedLabels[?LanguageCode==\`1036\`].Label | [0]
  }`;

const endpoints: readonly Endpoint[] = [
  {
    name: 'esdc_cctlettertypes',
    description: 'ESDC CCT Letter Types',
    outputFile: 'esdc_cctlettertypes.json',
    pathname: 'api/data/v9.2/esdc_cctlettertypes',
    query: {
      $filter: 'esdc_displayonportal eq 1 and statecode eq 0',
      $expand: 'esdc_ParentId',
    },
    jsonFilter: `value[].{
      id: esdc_value,
      order: esdc_order,
      nameEn: esdc_nameenglish,
      nameFr: esdc_namefrench,
      parentId: esdc_ParentId.esdc_value,
      parentOrder: esdc_ParentId.esdc_order,
      parentNameEn: esdc_ParentId.esdc_nameenglish,
      parentNameFr: esdc_ParentId.esdc_namefrench
    }`,
  },
  {
    name: 'esdc_clientfriendlystatuses',
    description: 'ESDC Client Friendly Statuses',
    outputFile: 'esdc_clientfriendlystatuses.json',
    pathname: 'api/data/v9.2/esdc_clientfriendlystatuses',
    query: {
      $filter: 'statecode eq 0',
    },
    jsonFilter: `value[].{
      id: esdc_clientfriendlystatusid,
      descriptionEn: esdc_descriptionenglish,
      descriptionFr: esdc_descriptionfrench
    }`,
  },
  {
    name: 'esdc_countries',
    description: 'ESDC Countries',
    outputFile: 'esdc_countries.json',
    pathname: 'api/data/v9.2/esdc_countries',
    query: {
      $filter: 'esdc_enabledentalapplicationportal eq true and statecode eq 0',
    },
    jsonFilter: `value[].{
      id: esdc_countryid,
      alpha3Code: esdc_countrycodealpha3,
      nameEn: esdc_nameenglish,
      nameFr: esdc_namefrench
    }`,
  },
  {
    name: 'esdc_governmentinsuranceplans (federal)',
    description: 'ESDC Federal Government Insurance Plans',
    outputFile: 'esdc_governmentinsuranceplans_federal.json',
    pathname: 'api/data/v9.2/esdc_governmentinsuranceplans',
    query: {
      $filter: '_esdc_provinceterritorystateid_value eq null and statecode eq 0',
    },
    jsonFilter: `value[].{
      id: esdc_governmentinsuranceplanid,
      code: esdc_code,
      nameEn: esdc_nameenglish,
      nameFr: esdc_namefrench
    }`,
  },
  {
    name: 'esdc_governmentinsuranceplans (provincial)',
    description: 'ESDC Provincial Government Insurance Plans',
    outputFile: 'esdc_governmentinsuranceplans_provincial.json',
    pathname: 'api/data/v9.2/esdc_governmentinsuranceplans',
    query: {
      $filter: '_esdc_provinceterritorystateid_value ne null and statecode eq 0',
    },
    jsonFilter: `value[].{
      id: esdc_governmentinsuranceplanid,
      code: esdc_code,
      nameEn: esdc_nameenglish,
      nameFr: esdc_namefrench,
      provinceTerritoryStateId: _esdc_provinceterritorystateid_value
    }`,
  },
  {
    name: 'esdc_maritalstatus',
    description: 'ESDC Marital Status',
    outputFile: 'esdc_maritalstatus.json',
    pathname: "api/data/v9.2/EntityDefinitions(LogicalName='esdc_dentalapplicant')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
    query: {
      $select: 'LogicalName',
      $filter: "LogicalName eq 'esdc_maritalstatus'",
      $expand: 'OptionSet($select=Options)',
    },
    jsonFilter: optionSetJsonFilter,
  },
  {
    name: 'esdc_preferredlanguage',
    description: 'ESDC Preferred Language',
    outputFile: 'esdc_preferredlanguage.json',
    pathname: "api/data/v9.2/EntityDefinitions(LogicalName='esdc_dentalapplicant')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
    query: {
      $select: 'LogicalName',
      $filter: "LogicalName eq 'esdc_preferredlanguage'",
      $expand: 'OptionSet($select=Options)',
    },
    jsonFilter: optionSetJsonFilter,
  },
  {
    name: 'esdc_preferredmethodofcommunication',
    description: 'ESDC Preferred Method of Communication',
    outputFile: 'esdc_preferredmethodofcommunication.json',
    pathname: "api/data/v9.2/EntityDefinitions(LogicalName='esdc_dentalapplicant')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
    query: {
      $select: 'LogicalName',
      $filter: "LogicalName eq 'esdc_preferredmethodofcommunication'",
      $expand: 'OptionSet($select=Options)',
    },
    jsonFilter: optionSetJsonFilter,
  },
  {
    name: 'esdc_provinceterritorystates',
    description: 'ESDC Province Territory States',
    outputFile: 'esdc_provinceterritorystates.json',
    pathname: 'api/data/v9.2/esdc_provinceterritorystates',
    query: {
      $filter: 'esdc_enabledentalapplicationportal eq true and statecode eq 0',
    },
    jsonFilter: `value[].{
      id: esdc_provinceterritorystateid,
      aplhaCode: esdc_internationalalphacode,
      nameEn: esdc_nameenglish,
      nameFr: esdc_namefrench,
      countryId: _esdc_countryid_value
    }`,
  },
];

const isEndpointEnabled = (endpoint: Endpoint): boolean => endpoint.disabled === undefined || endpoint.disabled === false;
const enabledEndpoints = endpoints.filter(isEndpointEnabled);
const enabledEndpointNames = enabledEndpoints.map((e) => e.name);

// Define CLI options
const program = new Command()
  .requiredOption('--auth-client-id <string>', 'Power Platform Auth Client ID')
  .requiredOption('--auth-client-secret <string>', 'Power Platform Auth Client Secret')
  .requiredOption('--auth-tenant-id <string>', 'Power Platform Auth Tenant ID')
  .option('--endpoints <string>', 'Comma-separated list of endpoint names to fetch (interactive selection if not specified)', (val) => val.split(',').filter(Boolean))
  .option('--non-interactive', 'Run in non-interactive mode (fetches all endpoints if --endpoints not specified)', false)
  .option('--output-dir <string>', 'Output directory', './app/.server/resources/power-platform-new')
  .option('--resource-url <string>', 'Power Platform Resource URL', 'https://canadadental-uat.crm3.dynamics.com/');

program.parse(process.argv);

const programOptions = program.opts();

// CLI options validation schema
const configSchema = v.object({
  authClientId: v.pipe(v.string(), v.nonEmpty()),
  authClientSecret: v.pipe(v.string(), v.nonEmpty()),
  authTenantId: v.pipe(v.string(), v.nonEmpty()),
  endpoints: v.optional(v.array(v.picklist(enabledEndpointNames))),
  nonInteractive: v.fallback(v.boolean(), false),
  outputDir: v.fallback(v.string(), './app/.server/resources'),
  resourceUrl: v.pipe(v.string(), v.url()),
});

type Config = v.InferOutput<typeof configSchema>;

class DataFetcher {
  private readonly spinner: Ora;
  private readonly endpointMap: Map<string, Endpoint>;
  private hasErrors = false;

  constructor() {
    this.spinner = ora();

    // Create a map for quick endpoint lookup by name
    this.endpointMap = new Map(enabledEndpoints.map((endpoint) => [endpoint.name, endpoint]));
  }

  private ensureOutputDir(path: string): void {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  private getConfig(): Config {
    try {
      this.spinner.start('Validating configuration...');
      const output = v.parse(configSchema, programOptions);
      this.spinner.succeed('Configuration is valid');
      return output;
    } catch (error) {
      this.spinner.fail('Error validating configuration');
      throw error;
    }
  }

  private async getAccessToken(config: Config): Promise<string> {
    try {
      this.spinner.start('Getting access token...');
      const tokenEndpoint = `https://login.microsoftonline.com/${config.authTenantId}/oauth2/token`;

      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', config.authClientId);
      formData.append('client_secret', config.authClientSecret);
      formData.append('resource', config.resourceUrl);

      const response = await request(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.statusCode !== 200) {
        const body = await response.body.text();
        throw new Error(`Failed to get token: ${response.statusCode} ${body}`);
      }

      const data = (await response.body.json()) as { access_token: string };
      this.spinner.succeed('Successfully got access token');
      return data.access_token;
    } catch (error) {
      this.spinner.fail('Error getting access token');
      throw error;
    }
  }

  /**
   * Formats a JSON string by cleaning up problematic characters and applying Prettier formatting.
   * @param data - The raw JSON string to be formatted.
   * @returns A formatted JSON string.
   * @throws Will throw an error if formatting fails.
   */
  private async formatJson(data: string): Promise<string> {
    try {
      const cleaned = this.cleanUnicode(data);
      const config = await this.loadPrettierConfig();
      return await this.formatWithPrettier(cleaned, config);
    } catch (error) {
      throw new Error('Error formatting JSON data.', { cause: error });
    }
  }

  /**
   * Replaces problematic Unicode characters in a string:
   * - Replaces typographic apostrophes (’) with straight apostrophes (').
   * - Escapes NO-BREAK SPACE (U+00A0) and NO-BREAK HYPHEN (U+2011) using Unicode escapes.
   * @param data - The string to clean.
   * @returns The cleaned string with normalized and escaped Unicode characters.
   */
  private cleanUnicode(data: string): string {
    return data
      .replace(/’/g, "'") //
      .replace(/[\u00A0\u2011]/g, (char) => {
        return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
      });
  }

  /**
   * Loads the Prettier configuration from the current working directory, if available.
   * @returns A Prettier configuration object, or null if no config is found.
   */
  private async loadPrettierConfig(): Promise<prettier.Options | null> {
    return await prettier.resolveConfig(process.cwd());
  }

  /**
   * Formats a string using Prettier with the provided configuration.
   * @param data - The JSON string to format.
   * @param config - The Prettier configuration to use.
   * @returns The formatted JSON string.
   */
  private async formatWithPrettier(data: string, config: prettier.Options | null): Promise<string> {
    return await prettier.format(data, {
      ...config,
      parser: 'json',
    });
  }

  private async fetchAndSaveData(accessToken: string, endpointBaseUrl: string, endpoint: Endpoint, outputDir: string): Promise<boolean> {
    try {
      this.spinner.start(`Fetching data from "${endpoint.name}" endpoint...`);

      const url = new URL(endpoint.pathname, endpointBaseUrl);
      if (endpoint.query) {
        for (const [key, value] of Object.entries(endpoint.query)) {
          url.searchParams.append(key, value);
        }
      }

      console.log(url.toString());
      const response = await request(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        throw new Error(`Failed to fetch data: ${response.statusCode} - ${errorBody}`);
      }

      let data = await response.body.json();

      // Apply JMESPath filter if defined for the endpoint
      if (endpoint.jsonFilter) {
        try {
          data = jmespath.search(data, endpoint.jsonFilter);
        } catch (filterError) {
          throw new Error(`Invalid JMESPath filter for endpoint "${endpoint.name}": ${filterError instanceof Error ? filterError.message : filterError}`);
        }
      }

      const jsonData = JSON.stringify(data, null, 2);
      const formattedData = await this.formatJson(jsonData);
      const outputFile = path.join(outputDir, endpoint.outputFile);

      fs.writeFileSync(outputFile, formattedData);

      this.spinner.succeed(`Successfully saved "${endpoint.name}" data to ${outputFile}`);
      return true;
    } catch (error) {
      this.spinner.fail(`Error fetching data from "${endpoint.name}": ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }

  // Interactive endpoint selection using inquirer
  private async selectEndpoints(): Promise<Endpoint[]> {
    const selected = await checkbox({
      message: 'Select endpoints to fetch:',
      choices: [...this.endpointMap.values()].map((endpoint) => ({
        value: endpoint.name,
        name: endpoint.name,
        description: endpoint.description,
      })),
      loop: false,
      required: true,
      pageSize: 10,
    });

    const selectedEndpoints = selected.map((name) => this.endpointMap.get(name)).filter((endpoint) => endpoint !== undefined);

    if (selectedEndpoints.length === 0) {
      throw new Error('No endpoints selected');
    }

    return selectedEndpoints;
  }

  // Get endpoints based on CLI input or selection
  private async getEndpointsToFetch(config: Config): Promise<Endpoint[]> {
    // If endpoints are specified via CLI option
    if (config.endpoints) {
      const filteredEndpoints = config.endpoints.map((name) => this.endpointMap.get(name)).filter((endpoint) => endpoint !== undefined);

      console.log(chalk.yellow(`Fetching ${filteredEndpoints.length} endpoints: ${filteredEndpoints.map((e) => e.name).join(', ')}`));

      return filteredEndpoints;
    }

    // Non-interactive mode - fetch all endpoints
    if (config.nonInteractive) {
      console.log(chalk.yellow(`Fetching all ${this.endpointMap.size} endpoints`));
      return [...this.endpointMap.values()];
    }

    // Interactive mode - prompt user to select endpoints
    return await this.selectEndpoints();
  }

  public async run(): Promise<void> {
    console.log(chalk.green.bold('🚀 Starting Power Platform Data Fetcher!\n'));

    try {
      const config = this.getConfig();
      this.ensureOutputDir(config.outputDir);

      // Get endpoints to fetch (from CLI, all, or interactive selection)
      const endpointsToFetch = await this.getEndpointsToFetch(config);

      // Get access token
      const accessToken = await this.getAccessToken(config);

      // Track success and failure counts
      const results = {
        succeeded: 0,
        failed: 0,
        total: endpointsToFetch.length,
      };

      // Process endpoints sequentially but continue on error
      for (const endpoint of endpointsToFetch) {
        const success = await this.fetchAndSaveData(accessToken, config.resourceUrl, endpoint, config.outputDir);
        if (success) {
          results.succeeded++;
        } else {
          results.failed++;
          this.hasErrors = true;
        }
      }

      // Final summary message
      if (this.hasErrors) {
        console.log(chalk.yellow(`\n⚠️ Data sync completed with some errors: ${results.succeeded}/${results.total} endpoints succeeded, ${results.failed}/${results.total} failed`));
      } else {
        console.log(chalk.green(`\n✨ Data sync completed successfully! ${results.succeeded}/${results.total} endpoints processed 🎉`));
      }
    } catch (error) {
      console.error(chalk.red('\nError in data sync process:'));
      if (error instanceof Error) {
        console.error(chalk.red(`  ${error.message}`));
      } else {
        console.error(chalk.red(`  ${error}`));
      }
      process.exit(1);
    }
  }
}

const fetcher = new DataFetcher();
await fetcher.run();
