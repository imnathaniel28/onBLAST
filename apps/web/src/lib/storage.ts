// Local keypair storage. The seed is what proves account ownership; losing it
// without having set up a recovery backup means losing the account (by design —
// see app-idea.md > Anonymity Protection).
//
// For MVP: localStorage. This is NOT ideal — a malicious script in the tab can
// read it. Before production, migrate to IndexedDB with non-extractable
// WebCrypto keys where possible, or ask the user for a passphrase on every
// session. Flagged for v2.

import {
  bytesToBase64Url,
  base64UrlToBytes,
  keypairFromSeed,
  publicKeyToId,
  type Keypair,
} from "@onblast/crypto";

const SEED_KEY = "onblast.seed";
const TOKEN_KEY = "onblast.accessToken";

export function loadKeypair(): Keypair | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(SEED_KEY);
  if (!raw) return null;
  const seed = base64UrlToBytes(raw);
  return keypairFromSeed(seed);
}

export function saveKeypair(kp: Keypair): void {
  localStorage.setItem(SEED_KEY, bytesToBase64Url(kp.seed));
}

export function clearKeypair(): void {
  localStorage.removeItem(SEED_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function loadAccessToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function currentAccountId(): string | null {
  const kp = loadKeypair();
  return kp ? publicKeyToId(kp.publicKey) : null;
}
