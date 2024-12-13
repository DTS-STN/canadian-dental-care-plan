import { inject, injectable } from 'inversify';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';

import { TYPES } from '~/.server/constants';
import type { LogFactory } from '~/.server/factories';
import { Logger } from '~/.server/factories';

export interface TokenRolesExtractor {
  extract(jwt?: string): Promise<string[]>;
}

@injectable()
export class DefaultTokenRolesExtractor implements TokenRolesExtractor {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    private readonly audience: string,
    private readonly issuer: string,
    private readonly jwksUrl?: string,
  ) {
    this.log = logFactory.createLogger(this.constructor.name);
  }

  async extract(jwt?: string): Promise<string[]> {
    this.log.trace('Extracting roles from token [%s]', jwt);

    if (jwt === undefined) {
      this.log.warn('Could not extract roles from token; Reason: no token provided');
      return [];
    }

    const roles = this.jwksUrl ? await this.decodeAndVerifyJwt(this.jwksUrl, jwt) : this.decodeJwt(jwt);
    this.log.debug('Extracted roles: %j', roles);
    return roles;
  }

  private decodeJwt(jwt: string): string[] {
    this.log.warn('JWT verification cannot be performed; Reason: JWK endpoint not configured');

    try {
      const { roles } = decodeJwt<{ roles?: string[] }>(jwt);
      return roles ?? [];
    } catch (error) {
      this.log.error('Could not extract roles from token', error);
      return [];
    }
  }

  private async decodeAndVerifyJwt(jwksUrl: string, jwt: string): Promise<string[]> {
    this.log.debug('JWK endpoint configured; Performing JWT verification');

    const getKey = createRemoteJWKSet(new URL(jwksUrl));
    const options = { audience: this.audience, issuer: this.issuer };

    try {
      const { payload } = await jwtVerify<{ roles?: string[] }>(jwt, getKey, options);
      return payload.roles ?? [];
    } catch (error) {
      this.log.error('Could not extract roles from token', error);
      return [];
    }
  }
}
