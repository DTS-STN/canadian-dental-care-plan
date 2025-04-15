import type { BenefitApplicationRequestEntity, BenefitApplicationResponseEntity, BenefitRenewalRequestEntity, BenefitRenewalResponseEntity } from '~/.server/domain/entities';
import type { InteropOperationOutcomeEntity } from '~/.server/shared/api/entities/interop-operation-outcome.entity';

export type BenefitApplicationPath = {
  parameters: {
    query?: never;
    header?: never;
    path?: never;
    cookie?: never;
  };
  get?: never;
  put?: never;
  post: SubmitBenefitApplicationOperation | SubmitBenefitApplicationRenewalOperation;
  delete?: never;
  options?: never;
  head?: never;
  patch?: never;
  trace?: never;
};

/**
 * Submit Application
 * @description Submit a benefit application to PowerPlatform
 */
type SubmitBenefitApplicationOperation = {
  parameters: {
    query?: never;
    header: {
      'Ocp-Apim-Subscription-Key': string;
    };
    path?: never;
    cookie?: never;
  };
  /** @description Applicant application information */
  requestBody: {
    content: {
      'application/json': BenefitApplicationRequestEntity;
    };
  };
  responses: {
    /** @description Successful application confirmation number */
    201: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': BenefitApplicationResponseEntity;
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

/**
 * Submit Application Renewal
 * @description Submit a benefit application renewal to PowerPlatform
 */
type SubmitBenefitApplicationRenewalOperation = {
  parameters: {
    query: {
      scenario: 'RENEWAL';
    };
    header: {
      'Ocp-Apim-Subscription-Key': string;
    };
    path?: never;
    cookie?: never;
  };
  /** @description Applicant application information */
  requestBody: {
    content: {
      'application/json': BenefitRenewalRequestEntity;
    };
  };
  responses: {
    /** @description Successful application confirmation number */
    201: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': BenefitRenewalResponseEntity;
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
