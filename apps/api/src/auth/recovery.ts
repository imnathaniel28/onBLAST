// Server side of optional passphrase recovery.
//
// The server stores only ciphertext + salt + kdf params. It cannot decrypt
// anything here. The endpoint to READ a backup is keyed by recoveryId — which
// is itself a secret the user writes down. See packages/crypto/src/recovery.ts.

import { prisma } from "../db.js";

export interface StoredBackup {
  recoveryId: string;
  ciphertext: string;
  kdfSalt: string;
  kdfParams: unknown;
}

export async function saveRecoveryBackup(params: {
  accountId: string;
  recoveryId: string;
  ciphertext: string;
  kdfSalt: string;
  kdfParams: unknown;
}): Promise<void> {
  await prisma.recoveryBackup.upsert({
    where: { accountId: params.accountId },
    create: {
      accountId: params.accountId,
      recoveryId: params.recoveryId,
      ciphertext: params.ciphertext,
      kdfSalt: params.kdfSalt,
      kdfParams: params.kdfParams as object,
    },
    update: {
      recoveryId: params.recoveryId,
      ciphertext: params.ciphertext,
      kdfSalt: params.kdfSalt,
      kdfParams: params.kdfParams as object,
    },
  });
}

export async function getRecoveryBackup(recoveryId: string): Promise<StoredBackup | null> {
  const row = await prisma.recoveryBackup.findUnique({ where: { recoveryId } });
  if (!row) return null;
  return {
    recoveryId: row.recoveryId,
    ciphertext: row.ciphertext,
    kdfSalt: row.kdfSalt,
    kdfParams: row.kdfParams,
  };
}
