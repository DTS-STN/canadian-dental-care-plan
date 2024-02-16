/**
 * Useful utility functions for crypto stuff.
 */
import { createHash, subtle, type webcrypto } from 'node:crypto';

/**
 * Generate a JWK ID from the modulus of the JWK.
 */
export function generateJwkId(jwk: webcrypto.JsonWebKey) {
  return createHash('md5')
    .update(jwk.n ?? '')
    .digest('hex');
}

/**
 * Takes a PEM-encoded private key as input and returns a CryptoKey object
 * that can be used to sign data.
 */
export async function privateKeyPemToCryptoKey(pem: string) {
  const keyData = Buffer.from(atob(pem), 'latin1');
  const algorithm = { name: 'RSA-PSS', hash: 'SHA-256' };
  return subtle.importKey('pkcs8', keyData, algorithm, true, ['sign']);
}

/**
 * Takes a PEM-encoded public key as input and returns a CryptoKey object
 * that can be used to verify data.
 */
export async function publicKeyPemToCryptoKey(pem: string) {
  const keyData = Buffer.from(atob(pem), 'latin1');
  const algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' };
  return subtle.importKey('spki', keyData, algorithm, true, ['encrypt', 'wrapKey']);
}
