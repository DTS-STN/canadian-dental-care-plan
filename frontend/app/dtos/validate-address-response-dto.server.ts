export interface ValidateWSAddressResponseDTOProps {
  responseType?: string;
  statusCode?: string;
  functionalMessages?: {action: string, message: string}[];
  message?: string;
  warnings?: string;
}

export class ValidateWSAddressResponseDTO implements ValidateWSAddressResponseDTOProps {

  responseType?: string;
  statusCode?: string;
  functionalMessages?: {action: string, message: string}[];
  message?: string;
  warnings?: string;

  constructor(responseType?: string,
    statusCode?: string,
    functionalMessages?: {action: string, message: string}[],
    message?: string,
    warnings?: string) {

    this.responseType = responseType;
    this.statusCode = statusCode;
    this.functionalMessages = functionalMessages;
    this.message = message;
    this.warnings = warnings;
  }
}