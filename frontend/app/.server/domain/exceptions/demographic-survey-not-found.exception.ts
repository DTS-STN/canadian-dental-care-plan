import { ResourceNotFoundException } from '~/.server/domain/exceptions/resource-not-found.exception';

export class IndigenousStatusNotFoundException extends ResourceNotFoundException {}
export class FirstNationsNotFoundException extends ResourceNotFoundException {}
export class DisabilityStatusNotFoundException extends ResourceNotFoundException {}
export class EthnicGroupNotFoundException extends ResourceNotFoundException {}
export class LocationBornStatusNotFoundException extends ResourceNotFoundException {}
export class GenderStatusNotFoundException extends ResourceNotFoundException {}
