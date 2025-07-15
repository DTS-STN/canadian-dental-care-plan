import type { Request } from 'express';
import assert from 'node:assert';
import type { Option } from 'oxide.ts';
import { None, Some } from 'oxide.ts';
import validator from 'validator';

import type { LetterDto } from '~/.server/domain/dtos';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
import type { ApplyState, ApplyStateSessionKey } from '~/.server/routes/helpers/apply-route-helpers';
import type { ProtectedApplyState, ProtectedApplyStateSessionKey } from '~/.server/routes/helpers/protected-apply-route-helpers';
import type { ProtectedRenewState, ProtectedRenewStateSessionKey } from '~/.server/routes/helpers/protected-renew-route-helpers';
import type { RenewState, RenewStateSessionKey } from '~/.server/routes/helpers/renew-route-helpers';
import type { StatusState, StatusStateSessionKey } from '~/.server/routes/helpers/status-route-helpers';
import type { IdToken, UserinfoToken } from '~/.server/utils/raoidc.utils';

type RequestSession = Request['session'];

/**
 * Defines the mapping of valid session keys to their corresponding value types.
 * Each property represents a key that can be stored in the session, and its value type.
 *
 * Extend this interface to add more session keys and their types as needed.
 */
type SessionTypeMap = {
  [K in ApplyStateSessionKey]: ApplyState;
} & {
  [K in ProtectedApplyStateSessionKey]: ProtectedApplyState;
} & {
  [K in ProtectedRenewStateSessionKey]: ProtectedRenewState;
} & {
  [K in RenewStateSessionKey]: RenewState;
} & {
  [K in StatusStateSessionKey]: StatusState;
} & {
  authCodeVerifier: string;
  authReturnUrl: string;
  authState: string;
  clientNumber: string;
  csrfToken: string;
  idToken: IdToken;
  lastAccessTime: string;
  letters: ReadonlyArray<LetterDto>;
  userInfoToken: UserinfoToken;
};

/**
 * Represents the set of valid keys for session data.
 * This type is derived from the keys of SessionTypeMap and is used to constrain
 * session operations to only valid, type-safe keys.
 */
export type SessionKey = keyof SessionTypeMap;

/**
 * Interface representing a session management system.
 * This interface defines methods to interact with session data in a type-safe manner.
 *
 * A session is typically a persistent object that stores user-related data across multiple requests.
 * Implementations of this interface should provide access to session data and allow modification or
 * removal of session keys and values.
 */
export interface Session {
  /**
   * The unique ID of the session.
   * @returns The session ID.
   */
  id: string;

  /**
   * Checks whether a specific session key exists.
   *
   * This method allows checking if a key is present in the session.
   *
   * @param key The session key to check.
   * @returns True if the key exists in the session, false otherwise.
   */
  has(key: SessionKey): boolean;

  /**
   * Finds a value in the session by its key.
   *
   * Retrieves the value associated with the given session key, wrapped in an Option.
   * Returns `None` if the key does not exist or is reserved. This method is useful
   * for safely accessing session data without throwing errors.
   *
   * @param key The session key to look up.
   * @returns An Option containing the value if present, or None if not found.
   */
  find<K extends SessionKey>(key: K): Option<SessionTypeMap[K]>;

  /**
   * Retrieves a value from the session by its key.
   *
   * This method works similarly to `find()`, but it throws an error if the key does not exist in the session.
   *
   * @param key The session key to retrieve.
   * @returns The value associated with the session key.
   * @throws Throws an error if the key is not found in the session.
   */
  get<K extends SessionKey>(key: K): SessionTypeMap[K];

  /**
   * Sets a value in the session for a given key.
   *
   * This method allows modifying or adding a new key-value pair in the session.
   *
   * @param key The session key to set.
   * @param value The value to set for the session key.
   */
  set<K extends SessionKey>(key: K, value: SessionTypeMap[K]): void;

  /**
   * Removes a key-value pair from the session.
   *
   * This method unsets a session key and its associated value.
   *
   * @param key The session key to remove.
   * @returns {boolean} Returns true if the key was removed successfully, false if the key doesn't exist.
   */
  unset(key: SessionKey): boolean;

  /**
   * Destroys the current session.
   *
   * This method will destroy the session, removing all session data and invalidating the session ID.
   *
   * @returns {void} This method does not return any value.
   */
  destroy(): void;
}

/**
 * Wrapper around the Express session object. Provides a type-safe and convenient API for session management.
 */
export class ExpressSession implements Session {
  private readonly session: RequestSession;
  static readonly SESSION_RESERVED_KEYS = ['id', 'cookie', 'regenerate', 'destroy', 'reload', 'resetMaxAge', 'save', 'touch'] as const;

  private readonly log: Logger;

  constructor(session: RequestSession) {
    this.session = session;
    assert.ok(session, 'Session object is undefined. Ensure session middleware is properly configured.');
    this.log = createLogger('~/.server/web/ExpressSession');
    this.log.trace('Session initialized with ID: %s', this.id);
  }

  get id(): string {
    return this.session.id;
  }

  has(key: SessionKey): boolean {
    const sanitizedKey = this.sanitizeKey(key);
    if (this.isReservedKey(sanitizedKey)) return false;
    const exists = sanitizedKey in this.session;
    this.log.trace('Checking session key existence: %s, exists: %s', sanitizedKey, exists);
    return exists;
  }

  find<K extends SessionKey>(key: K): Option<SessionTypeMap[K]> {
    if (!this.has(key)) return None;
    const sanitizedKey = this.sanitizeKey(key);
    const value = Some(this.session[sanitizedKey] as SessionTypeMap[K]);
    this.log.trace('Found value for session key: %s, value: %s', sanitizedKey, value);
    return value;
  }

  get<K extends SessionKey>(key: K): SessionTypeMap[K] {
    const value = this.find(key);
    if (value.isNone()) {
      this.log.error('Session key not found: %s, sessionId: %s', key, this.id);
      throw new Error(`Key '${key}' not found in session [${this.id}]`);
    }
    this.log.trace('Retrieved value for session key: %s, value: %s', key, value);
    return value.unwrap();
  }

  set<K extends SessionKey>(key: K, value: SessionTypeMap[K]): void {
    const sanitizedKey = this.sanitizeKey(key);
    this.assertNotReservedKey(sanitizedKey);
    this.session[sanitizedKey] = value;
    this.session.save((err) => {
      if (err) {
        this.log.error('Failed to save session: %s', err.message);
      } else {
        this.log.trace('Session key set successfully: %s', sanitizedKey);
      }
    });
  }

  unset(key: SessionKey): boolean {
    if (!this.has(key)) return false;
    const sanitizedKey = this.sanitizeKey(key);
    this.assertNotReservedKey(sanitizedKey);
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.session[sanitizedKey];
    this.session.save((err) => {
      if (err) {
        this.log.error('Failed to save session after unsetting key: %s, error: %s', sanitizedKey, err.message);
      } else {
        this.log.trace('Session key unset successfully: %s', sanitizedKey);
      }
    });
    return true;
  }

  destroy(): void {
    this.session.destroy((err) => {
      if (err) {
        this.log.error('Failed to destroy session: %s, error: %s', this.id, err.message);
      } else {
        this.log.trace('Session destroyed successfully: %s', this.id);
      }
    });
  }

  protected sanitizeKey(key: string): string {
    assert.ok(!validator.isEmpty(key, { ignore_whitespace: true }), 'Session key cannot be empty');
    let sanitized = key.replaceAll(/[^a-zA-Z0-9_$]/g, '_');
    if (!/^[a-zA-Z_$]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    this.log.trace('Sanitized session key: original %s, sanitized %s', key, sanitized);
    return sanitized;
  }

  protected isReservedKey(key: string): boolean {
    return ExpressSession.SESSION_RESERVED_KEYS.includes(key as (typeof ExpressSession.SESSION_RESERVED_KEYS)[number]);
  }

  protected assertNotReservedKey(key: string): void {
    assert.ok(!this.isReservedKey(key), `Session key '${key}' is reserved and cannot be used.`);
  }
}

/**
 * A session implementation for stateless requests where session management is not needed.
 * This class throws errors when any session-related methods are called to prevent misuse
 * in routes where sessions are not available or required.
 */
export class NoopSession implements Session {
  get id(): string {
    throw new Error('No session available in stateless context');
  }

  has(key: SessionKey): boolean {
    return false;
  }

  find<K extends SessionKey>(key: K): Option<SessionTypeMap[K]> {
    return None;
  }

  get<K extends SessionKey>(key: K): SessionTypeMap[K] {
    throw new Error('No session available in stateless context');
  }

  set<K extends SessionKey>(key: K, value: SessionTypeMap[K]): void {
    throw new Error('No session available in stateless context');
  }

  unset(key: SessionKey): boolean {
    return false;
  }

  destroy(): void {
    // No operation; no session to destroy in a stateless context.
  }
}
