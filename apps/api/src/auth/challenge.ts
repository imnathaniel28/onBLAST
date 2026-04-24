import { randomBytes } from "node:crypto";
import { prisma } from "../db.js";
import { config } from "../config.js";

export interface IssuedChallenge {
  nonce: string;
  expiresAt: Date;
}

export async function issueChallenge(publicKey: string): Promise<IssuedChallenge> {
  const nonce = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.challengeTtlSeconds * 1000);
  await prisma.challenge.create({
    data: { publicKey, nonce, expiresAt, consumed: false },
  });
  return { nonce, expiresAt };
}

export async function consumeChallenge(
  publicKey: string,
  nonce: string,
): Promise<boolean> {
  // Single-use: UPDATE ... WHERE consumed=false yields a match only once.
  const result = await prisma.challenge.updateMany({
    where: {
      publicKey,
      nonce,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    data: { consumed: true },
  });
  return result.count === 1;
}
