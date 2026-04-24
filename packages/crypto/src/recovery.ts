// Optional passphrase-based recovery.
//
// Protocol:
//   1. Client derives a 32-byte key from the user's passphrase + a random salt
//      via scrypt. Passphrase NEVER leaves the client.
//   2. Client encrypts the 32-byte Ed25519 seed with AES-256-GCM using that
//      key + a random 12-byte IV. IV is prepended to the ciphertext.
//   3. Client sends the resulting blob + salt + kdf params to the server,
//      keyed under a user-chosen recoveryId.
//   4. On recovery, client fetches the blob by recoveryId, re-derives the key
//      from the passphrase, decrypts, reconstructs the keypair.
//
// The server never holds the passphrase, the derived key, or the plaintext
// seed. A subpoena for a recovery backup returns an opaque ciphertext.

import { gcm } from "@noble/ciphers/aes";
import { scrypt } from "@noble/hashes/scrypt";
import { randomBytes } from "@noble/hashes/utils";
import { bytesToBase64Url, base64UrlToBytes } from "./encoding.js";

export interface ScryptParams {
  N: number; // CPU/memory cost. Must be power of 2.
  r: number; // block size
  p: number; // parallelization
  dkLen: 32;
}

export const DEFAULT_SCRYPT_PARAMS: ScryptParams = {
  N: 1 << 15, // 32768
  r: 8,
  p: 1,
  dkLen: 32,
};

export interface RecoveryBackup {
  recoveryId: string;
  ciphertext: string; // base64url, iv || aes-gcm(ciphertext+tag)
  kdfSalt: string;    // base64url
  kdfParams: ScryptParams;
}

function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  params: ScryptParams,
): Uint8Array {
  return scrypt(new TextEncoder().encode(passphrase.normalize("NFKC")), salt, {
    N: params.N,
    r: params.r,
    p: params.p,
    dkLen: params.dkLen,
  });
}

export function generateRecoveryId(): string {
  // 16 bytes → ~22 chars base64url. Enough entropy that guessing is infeasible.
  return bytesToBase64Url(randomBytes(16));
}

export function createRecoveryBackup(
  seed: Uint8Array,
  passphrase: string,
  recoveryId: string = generateRecoveryId(),
  params: ScryptParams = DEFAULT_SCRYPT_PARAMS,
): RecoveryBackup {
  if (seed.length !== 32) throw new Error("seed must be 32 bytes");
  const salt = randomBytes(16);
  const key = deriveKey(passphrase, salt, params);
  const iv = randomBytes(12);
  const cipher = gcm(key, iv);
  const ct = cipher.encrypt(seed);
  const blob = new Uint8Array(iv.length + ct.length);
  blob.set(iv, 0);
  blob.set(ct, iv.length);
  return {
    recoveryId,
    ciphertext: bytesToBase64Url(blob),
    kdfSalt: bytesToBase64Url(salt),
    kdfParams: params,
  };
}

export function restoreSeedFromBackup(
  backup: Pick<RecoveryBackup, "ciphertext" | "kdfSalt" | "kdfParams">,
  passphrase: string,
): Uint8Array {
  const blob = base64UrlToBytes(backup.ciphertext);
  const salt = base64UrlToBytes(backup.kdfSalt);
  const iv = blob.slice(0, 12);
  const ct = blob.slice(12);
  const key = deriveKey(passphrase, salt, backup.kdfParams);
  const cipher = gcm(key, iv);
  const seed = cipher.decrypt(ct);
  if (seed.length !== 32) throw new Error("decrypted seed has wrong length");
  return seed;
}
