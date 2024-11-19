import { BaseHttpException } from './base-http.exception';
import type { HttpHeaders } from '~/.server/http/http-client';

export class HttpClientResponseException extends BaseHttpException {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly result?: unknown,
    public readonly headers?: HttpHeaders,
  ) {
    super(message);
  }
}
