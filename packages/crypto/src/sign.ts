// Challenge-response signing. The server issues a nonce; the client signs it
// with the private key; the server verifies against the claimed public key.
//
// Same code runs in the browser, in Node (server), and in React Native later.

import { ed25519 } from "@noble/curves/ed25519";
import { base64UrlToBytes, bytesToBase64Url } from "./encoding.js";

export function signChallenge(seed: Uint8Array, nonce: string): string {
  const message = new TextEncoder().encode(nonce);
  const sig = ed25519.sign(message, seed);
  return bytesToBase64Url(sig);
}

export function verifyChallenge(
  signatureB64: string,
  nonce: string,
  publicKey: Uint8Array,
): boolean {
  const sig = base64UrlToBytes(signatureB64);
  const message = new TextEncoder().encode(nonce);
  try {
    return ed25519.verify(sig, message, publicKey);
  } catch {
    return false;
  }
}
