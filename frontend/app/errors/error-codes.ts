export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCodes = {
  UNCAUGHT_ERROR: 'UNC-0000',

  // instance error codes
  NO_FACTORY_PROVIDED: 'INST-0001',

  // dev-only error codes
  TEST_ERROR_CODE: 'DEV-0001',

  // external api error codes
  XAPI_API_ERROR: 'XAPI-0001',
} as const;
