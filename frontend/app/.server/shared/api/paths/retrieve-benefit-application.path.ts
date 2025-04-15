import type { ClientApplicationBasicInfoRequestEntity, ClientApplicationEntity, ClientApplicationSinRequestEntity } from '~/.server/domain/entities';
import type { InteropOperationOutcomeEntity } from '~/.server/shared/api/entities/interop-operation-outcome.entity';

export type RetrieveBenefitApplicationPath = {
  parameters: {
    query?: never;
    header?: never;
    path?: never;
    cookie?: never;
  };
  get?: never;
  put?: never;
  post: GetApplicantInformationByBasicInfoOperation | GetApplicantInformationBySinOperation;
  delete?: never;
  options?: never;
  head?: never;
  patch?: never;
  trace?: never;
};

/**
 * Personal Information
 * @description Get Applicant information from PowerPlatform
 */
type GetApplicantInformationByBasicInfoOperation = {
  parameters: {
    query?: never;
    header: {
      'Ocp-Apim-Subscription-Key': string;
    };
    path?: never;
    cookie?: never;
  };
  /** @description Applicant identifier */
  requestBody: {
    content: {
      'application/json': ClientApplicationBasicInfoRequestEntity;
    };
  };
  responses: {
    /** @description Successful query */
    200: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': ClientApplicationEntity;
      };
    };
    /** @description Applicant not found */
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

/**
 * Personal Information
 * @description Get Applicant information from PowerPlatform
 */

type GetApplicantInformationBySinOperation = {
  parameters: {
    query?: never;
    header: {
      'Ocp-Apim-Subscription-Key': string;
    };
    path?: never;
    cookie?: never;
  };
  /** @description Applicant identifier */
  requestBody: {
    content: {
      'application/json': ClientApplicationSinRequestEntity;
    };
  };
  responses: {
    /** @description Successful query */
    200: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': ClientApplicationEntity;
      };
    };
    /** @description Applicant not found */
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
