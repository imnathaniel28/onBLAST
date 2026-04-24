// Ed25519 keypair. Account identity == publicKey.
//
// The 32-byte seed IS the private key material; the full private key is
// derived from it. When recovery is enabled, the seed is what gets encrypted
// with the user's passphrase.

import { ed25519 } from "@noble/curves/ed25519";
import { randomBytes } from "@noble/hashes/utils";
import { bytesToBase64Url, base64UrlToBytes } from "./encoding.js";

export interface Keypair {
  seed: Uint8Array;      // 32 bytes. Treat as secret. Never send to server.
  publicKey: Uint8Array; // 32 bytes. This is the account id.
}

export function generateKeypair(): Keypair {
  const seed = randomBytes(32);
  const publicKey = ed25519.getPublicKey(seed);
  return { seed, publicKey };
}

export function keypairFromSeed(seed: Uint8Array): Keypair {
  if (seed.length !== 32) throw new Error("seed must be 32 bytes");
  const publicKey = ed25519.getPublicKey(seed);
  return { seed, publicKey };
}

export function publicKeyToId(publicKey: Uint8Array): string {
  return bytesToBase64Url(publicKey);
}

export function idToPublicKey(id: string): Uint8Array {
  const bytes = base64UrlToBytes(id);
  if (bytes.length !== 32) throw new Error("invalid public key length");
  return bytes;
}
