import type { ApplicantRequestEntity, ApplicantResponseEntity } from '~/.server/domain/entities';
import type { InteropOperationOutcomeEntity } from '~/.server/shared/api/entities/interop-operation-outcome.entity';

export type ApplicantPath = {
  parameters: {
    query?: never;
    header?: never;
    path?: never;
    cookie?: never;
  };
  get?: never;
  put?: never;
  post: RetrieveApplicationOperation;
  delete?: never;
  options?: never;
  head?: never;
  patch?: never;
  trace?: never;
};

/**
 * Retrieve Application
 * @description Retrieve a benefit application from PowerPlatform
 */
type RetrieveApplicationOperation = {
  parameters: {
    query?: never;
    header: {
      'Ocp-Apim-Subscription-Key': string;
    };
    path?: never;
    cookie?: never;
  };
  /** @description Application identifier */
  requestBody: {
    content: {
      'application/json': ApplicantRequestEntity;
    };
  };
  responses: {
    /** @description Successful query */
    200: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': ApplicantResponseEntity;
      };
    };
    /** @description Application not found */
    204: {
      headers: {
        [name: string]: unknown;
      };
      content?: never;
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
