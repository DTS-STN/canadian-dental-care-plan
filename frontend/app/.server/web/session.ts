import type { Request } from 'express';
import assert from 'node:assert';
import validator from 'validator';

import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';

type RequestSession = Request['session'];

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
   * @returns {string} The session ID.
   */
  id: string;

  /**
   * Checks whether a specific session key exists.
   *
   * This method allows checking if a key is present in the session.
   *
   * @param key The session key to check.
   * @returns {boolean} True if the key exists in the session, false otherwise.
   */
  has(key: string): boolean;

  /**
   * Finds a value in the session by its key.
   *
   * This method retrieves the value associated with a given session key. If the key doesn't exist, it returns `undefined`.
   *
   * @param key The session key to find.
   * @returns {T | undefined} The value associated with the key, or `undefined` if the key does not exist in the session.
   */
  find<T>(key: string): T | undefined;

  /**
   * Retrieves a value from the session by its key.
   *
   * This method works similarly to `find()`, but it throws an error if the key does not exist in the session.
   *
   * @param key The session key to retrieve.
   * @returns {T} The value associated with the session key.
   * @throws {Error} Throws an error if the key is not found in the session.
   */
  get<T>(key: string): T;

  /**
   * Sets a value in the session for a given key.
   *
   * This method allows modifying or adding a new key-value pair in the session.
   *
   * @param key The session key to set.
   * @param value The value to set for the session key.
   * @returns {this} The current instance of the session, enabling method chaining.
   */
  set<T = unknown>(key: string, value: T): this;

  /**
   * Removes a key-value pair from the session.
   *
   * This method unsets a session key and its associated value.
   *
   * @param key The session key to remove.
   * @returns {boolean} Returns true if the key was removed successfully, false if the key doesn't exist.
   */
  unset(key: string): boolean;

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
    this.log = createLogger('~/.server/web/Session');
    this.log.trace('Session initialized with ID: %s', this.id);
  }

  get id(): string {
    return this.session.id;
  }

  has(key: string): boolean {
    const sanitizedKey = this.sanitizeKey(key);
    if (this.isReservedKey(sanitizedKey)) return false;
    const exists = sanitizedKey in this.session;
    this.log.trace('Checking session key existence: %s, exists: %s', sanitizedKey, exists);
    return exists;
  }

  find<T>(key: string): T | undefined {
    if (!this.has(key)) return undefined;
    const sanitizedKey = this.sanitizeKey(key);
    const value = this.session[sanitizedKey] as T | undefined;
    this.log.trace('Found value for session key: %s, value: %s', sanitizedKey, value);
    return value;
  }

  get<T>(key: string): T {
    const value = this.find<T>(key);
    if (value === undefined) {
      this.log.error('Session key not found: %s, sessionId: %s', key, this.id);
      throw new Error(`Key '${key}' not found in session [${this.id}]`);
    }
    this.log.trace('Retrieved value for session key: %s, value: %s', key, value);
    return value;
  }

  set<T = unknown>(key: string, value: T): this {
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
    return this;
  }

  unset(key: string): boolean {
    const sanitizedKey = this.sanitizeKey(key);
    if (!this.has(sanitizedKey)) return false;
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

  has(key: string): boolean {
    return false;
  }

  find<T>(key: string): T | undefined {
    return undefined;
  }

  get<T>(key: string): T {
    throw new Error('No session available in stateless context');
  }

  set<T = unknown>(key: string, value: T): this {
    throw new Error('No session available in stateless context');
  }

  unset(key: string): boolean {
    return false;
  }

  destroy(): void {
    // No operation; no session to destroy in a stateless context.
  }
}
