import type { ApplicationYearResultEntity } from '~/.server/domain/entities';
import type { InteropOperationOutcomeEntity } from '~/.server/shared/api/entities/interop-operation-outcome.entity';

export type RetrieveBenefitApplicationConfigDatesPath = {
  parameters: {
    query?: never;
    header?: never;
    path?: never;
    cookie?: never;
  };
  get: GetApplicationConfigDatesOperation;
  put?: never;
  post?: never;
  delete?: never;
  options?: never;
  head?: never;
  patch?: never;
  trace?: never;
};

type GetApplicationConfigDatesOperation = {
  parameters: {
    query: {
      /** @description The date to use to request application date configuration information */
      date: string;
    };
    header: {
      'Accept-Language': 'en-CA';
      'Ocp-Apim-Subscription-Key': string;
    };
    path?: never;
    cookie?: never;
  };
  requestBody?: never;
  responses: {
    /** @description Successful query */
    200: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': ApplicationYearResultEntity;
      };
    };
    /** @description Bad request failure */
    400: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': InteropOperationOutcomeEntity;
      };
    };
    /** @description Internal server error */
    500: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': InteropOperationOutcomeEntity;
      };
    };
  };
};
