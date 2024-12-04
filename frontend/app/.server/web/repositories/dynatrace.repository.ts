import { inject, injectable } from 'inversify';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import type { HttpClient } from '~/.server/http';
import { expandTemplate } from '~/utils/string-utils';

export interface DynatraceRepository {
  /**
   * Retrieves the Dynatrace Real User Monitoring (RUM) script.
   *
   * @returns A promise that resolves to the RUM script content as a string, or `null` if the RUM script uri cannot be found.
   */
  findDynatraceRumScript(): Promise<string | null>;
}

@injectable()
export class DefaultDynatraceRepository implements DynatraceRepository {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: Pick<ServerConfig, 'HTTP_PROXY_URL' | 'DYNATRACE_API_RUM_SCRIPT_TOKEN' | 'DYNATRACE_API_RUM_SCRIPT_URI'>,
    @inject(TYPES.http.HttpClient) private readonly httpClient: HttpClient,
  ) {
    this.log = logFactory.createLogger('DefaultDynatraceRepository');
  }

  async findDynatraceRumScript(): Promise<string | null> {
    this.log.trace('Fetching Dynatrace RUM script.');

    if (this.serverConfig.DYNATRACE_API_RUM_SCRIPT_URI === undefined) {
      this.log.debug('DYNATRACE_API_RUM_SCRIPT_URI is undefined; returning null');
      return null;
    }

    const retrieveRumScriptUrl = new URL(expandTemplate(this.serverConfig.DYNATRACE_API_RUM_SCRIPT_URI, { token: this.serverConfig.DYNATRACE_API_RUM_SCRIPT_TOKEN ?? '' }));
    this.log.debug('Retrieve RUM Script url is generated; url: [%s]', retrieveRumScriptUrl);

    const response = await this.httpClient.instrumentedFetch('http.client.dynatrace-api.retrieve-rum-script.gets', retrieveRumScriptUrl, { proxyUrl: this.serverConfig.HTTP_PROXY_URL });

    if (!response.ok) {
      this.log.error('%j', {
        message: "Failed to 'GET' the Dynatrace RUM Script",
        status: response.status,
        statusText: response.statusText,
        url: retrieveRumScriptUrl,
        responseBody: await response.text(),
      });
      throw new Error(`Failed to 'GET' the Dynatrace RUM Script. Status:  ${response.status}, Status Text: ${response.statusText}`);
    }

    const script = await response.text();
    this.log.trace('Returning Dynatrace RUM script [%s]', script);
    return script;
  }
}