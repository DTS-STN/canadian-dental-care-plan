/**
 * Useful utility functions for crypto stuff.
 */
import { subtle } from 'node:crypto';

/**
 * Takes a PEM-encoded private key as input and returns a CryptoKey object
 * that can be used to sign data.
 */
export function privateKeyPemToCryptoKey(pem: string) {
  const keyData = Buffer.from(atob(pem), 'latin1');
  const algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' };
  return subtle.importKey('pkcs8', keyData, algorithm, true, ['decrypt', 'unwrapKey']);
}

/**
 * Takes a PEM-encoded public key as input and returns a CryptoKey object
 * that can be used to verify data.
 */
export function publicKeyPemToCryptoKey(pem: string) {
  const keyData = Buffer.from(atob(pem), 'latin1');
  const algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' };
  return subtle.importKey('spki', keyData, algorithm, true, ['encrypt', 'wrapKey']);
}
