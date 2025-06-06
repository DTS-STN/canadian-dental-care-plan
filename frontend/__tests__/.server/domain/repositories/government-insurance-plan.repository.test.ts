import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { DefaultGovernmentInsurancePlanRepository, MockGovernmentInsurancePlanRepository } from '~/.server/domain/repositories';
import type { DefaultGovernmentInsurancePlanRepositoryServerConfig } from '~/.server/domain/repositories';
import type { HttpClient } from '~/.server/http';

const dataSource = vi.hoisted(() => ({
  default: {
    value: [
      {
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Provincial Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '10',
      },
      {
        esdc_governmentinsuranceplanid: '2',
        esdc_nameenglish: 'Second Provincial Insurance Plan',
        esdc_namefrench: "Deuxième plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '20',
      },
      {
        esdc_governmentinsuranceplanid: '3',
        esdc_nameenglish: 'First Insurance Plan Federal',
        esdc_namefrench: "Premier plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
      {
        esdc_governmentinsuranceplanid: '4',
        esdc_nameenglish: 'Second Insurance Plan Federal',
        esdc_namefrench: "Deuxième plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
    ],
  },
}));

vi.mock('~/.server/resources/power-platform/government-insurance-plan.json', () => dataSource);

describe('DefaultGovernmentInsurancePlanRepository', () => {
  let serverConfigMock: DefaultGovernmentInsurancePlanRepositoryServerConfig;

  beforeEach(() => {
    serverConfigMock = {
      INTEROP_API_BASE_URI: 'https://api.example.com',
      INTEROP_API_SUBSCRIPTION_KEY: 'SUBSCRIPTION_KEY',
      INTEROP_API_MAX_RETRIES: 10,
      INTEROP_API_BACKOFF_MS: 3,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should throw error on listAllFederalGovernmentInsurancePlans call', async () => {
    const responseDataMock = [
      {
        esdc_governmentinsuranceplanid: '0',
        esdc_nameenglish: 'name english',
        esdc_namefrench: 'name french',
        _esdc_provinceterritorystateid_value: null,
      },
    ];

    const httpClientMock = mock<HttpClient>();
    httpClientMock.instrumentedFetch.mockResolvedValue(Response.json(responseDataMock));

    // act
    const repository = new DefaultGovernmentInsurancePlanRepository(serverConfigMock, httpClientMock);
    const actual = await repository.listAllFederalGovernmentInsurancePlans();

    expect(actual).toEqual(responseDataMock);

    expect(httpClientMock.instrumentedFetch).toHaveBeenCalledExactlyOnceWith(
      'http.client.interop-api.government-insurance-plans.gets',
      new URL('https://api.example.com/dental-care/code-list/pp/v1/governmentinsuranceplans?%24select=+esdc_governmentinsuranceplanid%2Cesdc_nameenglish%2Cesdc_namefrench%2C_esdc_provinceterritorystateid_value&%24filter=statecode+eq+0'),
      {
        proxyUrl: serverConfigMock.HTTP_PROXY_URL,
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': serverConfigMock.INTEROP_API_SUBSCRIPTION_KEY,
        },
        retryOptions: {
          backoffMs: 3,
          retries: 10,
          retryConditions: {
            '502': [],
          },
        },
      },
    );
  });

  it('should throw error on findFederalGovernmentInsurancePlanById call', async () => {
    const responseDataMock = [
      {
        esdc_governmentinsuranceplanid: '0',
        esdc_nameenglish: 'name english',
        esdc_namefrench: 'name french',
        _esdc_provinceterritorystateid_value: null,
      },
    ];

    const httpClientMock = mock<HttpClient>();
    httpClientMock.instrumentedFetch.mockResolvedValue(Response.json(responseDataMock));

    // act
    const repository = new DefaultGovernmentInsurancePlanRepository(serverConfigMock, httpClientMock);
    const actual = await repository.findFederalGovernmentInsurancePlanById('0');

    expect(actual).toEqual(responseDataMock[0]);

    expect(httpClientMock.instrumentedFetch).toHaveBeenCalledExactlyOnceWith(
      'http.client.interop-api.government-insurance-plans.gets',
      new URL('https://api.example.com/dental-care/code-list/pp/v1/governmentinsuranceplans?%24select=+esdc_governmentinsuranceplanid%2Cesdc_nameenglish%2Cesdc_namefrench%2C_esdc_provinceterritorystateid_value&%24filter=statecode+eq+0'),
      {
        proxyUrl: serverConfigMock.HTTP_PROXY_URL,
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': serverConfigMock.INTEROP_API_SUBSCRIPTION_KEY,
        },
        retryOptions: {
          backoffMs: 3,
          retries: 10,
          retryConditions: {
            '502': [],
          },
        },
      },
    );
  });

  it('should throw error on listAllProvincialGovernmentInsurancePlans call', async () => {
    const responseDataMock = [
      {
        esdc_governmentinsuranceplanid: '0',
        esdc_nameenglish: 'name english',
        esdc_namefrench: 'name french',
        _esdc_provinceterritorystateid_value: '0',
      },
    ];

    const httpClientMock = mock<HttpClient>();
    httpClientMock.instrumentedFetch.mockResolvedValue(Response.json(responseDataMock));

    // act
    const repository = new DefaultGovernmentInsurancePlanRepository(serverConfigMock, httpClientMock);
    const actual = await repository.listAllProvincialGovernmentInsurancePlans();

    expect(actual).toEqual(responseDataMock);

    expect(httpClientMock.instrumentedFetch).toHaveBeenCalledExactlyOnceWith(
      'http.client.interop-api.government-insurance-plans.gets',
      new URL('https://api.example.com/dental-care/code-list/pp/v1/governmentinsuranceplans?%24select=+esdc_governmentinsuranceplanid%2Cesdc_nameenglish%2Cesdc_namefrench%2C_esdc_provinceterritorystateid_value&%24filter=statecode+eq+0'),
      {
        proxyUrl: serverConfigMock.HTTP_PROXY_URL,
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': serverConfigMock.INTEROP_API_SUBSCRIPTION_KEY,
        },
        retryOptions: {
          backoffMs: 3,
          retries: 10,
          retryConditions: {
            '502': [],
          },
        },
      },
    );
  });

  it('should throw error on findProvincialGovernmentInsurancePlanById call', async () => {
    const responseDataMock = [
      {
        esdc_governmentinsuranceplanid: '0',
        esdc_nameenglish: 'name english',
        esdc_namefrench: 'name french',
        _esdc_provinceterritorystateid_value: '0',
      },
    ];

    const httpClientMock = mock<HttpClient>();
    httpClientMock.instrumentedFetch.mockResolvedValue(Response.json(responseDataMock));

    // act
    const repository = new DefaultGovernmentInsurancePlanRepository(serverConfigMock, httpClientMock);
    const actual = await repository.findProvincialGovernmentInsurancePlanById('0');

    expect(actual).toEqual(responseDataMock[0]);

    expect(httpClientMock.instrumentedFetch).toHaveBeenCalledExactlyOnceWith(
      'http.client.interop-api.government-insurance-plans.gets',
      new URL('https://api.example.com/dental-care/code-list/pp/v1/governmentinsuranceplans?%24select=+esdc_governmentinsuranceplanid%2Cesdc_nameenglish%2Cesdc_namefrench%2C_esdc_provinceterritorystateid_value&%24filter=statecode+eq+0'),
      {
        proxyUrl: serverConfigMock.HTTP_PROXY_URL,
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': serverConfigMock.INTEROP_API_SUBSCRIPTION_KEY,
        },
        retryOptions: {
          backoffMs: 3,
          retries: 10,
          retryConditions: {
            '502': [],
          },
        },
      },
    );
  });
});

describe('MockGovernmentInsurancePlanRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should get all federal government insurance plans', async () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlans = await repository.listAllFederalGovernmentInsurancePlans();

    expect(federalGovernmentInsurancePlans).toEqual([
      {
        esdc_governmentinsuranceplanid: '3',
        esdc_nameenglish: 'First Insurance Plan Federal',
        esdc_namefrench: "Premier plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
      {
        esdc_governmentinsuranceplanid: '4',
        esdc_nameenglish: 'Second Insurance Plan Federal',
        esdc_namefrench: "Deuxième plan d'assurance fédéral",
        _esdc_provinceterritorystateid_value: null,
      },
    ]);
  });

  it('should handle empty federal government insurance plans data', async () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlans = await repository.listAllFederalGovernmentInsurancePlans();

    expect(federalGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a federal government insurance plan by id', async () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = await repository.findFederalGovernmentInsurancePlanById('3');

    expect(federalGovernmentInsurancePlan).toEqual({
      esdc_governmentinsuranceplanid: '3',
      esdc_nameenglish: 'First Insurance Plan Federal',
      esdc_namefrench: "Premier plan d'assurance fédéral",
      _esdc_provinceterritorystateid_value: null,
    });
  });

  it('should return null for non-existent federal government insurance plan id', async () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const federalGovernmentInsurancePlan = await repository.findFederalGovernmentInsurancePlanById('non-existent-id');

    expect(federalGovernmentInsurancePlan).toBeNull();
  });

  it('should get all provincial government insurance plans', async () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = await repository.listAllProvincialGovernmentInsurancePlans();

    expect(provincialGovernmentInsurancePlans).toEqual([
      {
        esdc_governmentinsuranceplanid: '1',
        esdc_nameenglish: 'First Provincial Insurance Plan',
        esdc_namefrench: "Premier plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '10',
      },
      {
        esdc_governmentinsuranceplanid: '2',
        esdc_nameenglish: 'Second Provincial Insurance Plan',
        esdc_namefrench: "Deuxième plan d'assurance provincial",
        _esdc_provinceterritorystateid_value: '20',
      },
    ]);
  });

  it('should handle empty provincial government insurance plans data', async () => {
    vi.spyOn(dataSource, 'default', 'get').mockReturnValueOnce({ value: [] });

    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = await repository.listAllProvincialGovernmentInsurancePlans();

    expect(provincialGovernmentInsurancePlans).toEqual([]);
  });

  it('should get a provincial government insurance plan by id', async () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = await repository.findProvincialGovernmentInsurancePlanById('1');

    expect(provincialGovernmentInsurancePlans).toEqual({
      esdc_governmentinsuranceplanid: '1',
      esdc_nameenglish: 'First Provincial Insurance Plan',
      esdc_namefrench: "Premier plan d'assurance provincial",
      _esdc_provinceterritorystateid_value: '10',
    });
  });

  it('should return null for non-existent provincial government insurance plan id', async () => {
    const repository = new MockGovernmentInsurancePlanRepository();

    const provincialGovernmentInsurancePlans = await repository.findProvincialGovernmentInsurancePlanById('non-existent-id');

    expect(provincialGovernmentInsurancePlans).toBeNull();
  });
});
