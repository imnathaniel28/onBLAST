import { idToPublicKey, verifyChallenge } from "@onblast/crypto";
import { consumeChallenge } from "./challenge.js";
import { prisma } from "../db.js";

export interface AuthenticateResult {
  accountId: string;
  publicKey: string;
  created: boolean;
}

// Authenticate by proving control of the private key paired with publicKey.
// If no account exists for this publicKey, one is created. This collapses
// "signup" and "login" into the single keypair-based flow the spec calls for.
export async function authenticateByChallenge(params: {
  publicKey: string;
  nonce: string;
  signature: string;
}): Promise<AuthenticateResult> {
  const { publicKey, nonce, signature } = params;

  const pk = idToPublicKey(publicKey);
  if (!verifyChallenge(signature, nonce, pk)) {
    throw new AuthError("invalid signature");
  }

  const consumed = await consumeChallenge(publicKey, nonce);
  if (!consumed) {
    throw new AuthError("challenge expired, already used, or not found");
  }

  const existing = await prisma.account.findUnique({ where: { publicKey } });
  if (existing) {
    return { accountId: existing.id, publicKey, created: false };
  }
  const created = await prisma.account.create({ data: { publicKey } });
  return { accountId: created.id, publicKey, created: true };
}

export class AuthError extends Error {
  statusCode = 401;
  constructor(msg: string) {
    super(msg);
  }
}
