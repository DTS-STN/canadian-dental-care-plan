import { BaseDomainException } from '~/.server/domain/exceptions/base-domain.exception';

/**
 * Represents an error signifying that a client has exceeded a rate limit
 * or sent too many requests within a specific time frame.
 *
 * This exception is typically thrown when rate limiting mechanisms are triggered
 * and often corresponds to the HTTP 429 'Too Many Requests' status code.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429 | HTTP 429 Too Many Requests}
 */
export class TooManyRequestsException extends BaseDomainException {}
