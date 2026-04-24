import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { issueChallenge } from "./challenge.js";
import { authenticateByChallenge, AuthError } from "./verify.js";
import { issueAccessToken, verifyAccessToken } from "./jwt.js";
import { saveRecoveryBackup, getRecoveryBackup } from "./recovery.js";

const PublicKeySchema = z.string().min(40).max(48);

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/challenge", async (req, reply) => {
    const body = z.object({ publicKey: PublicKeySchema }).parse(req.body);
    const c = await issueChallenge(body.publicKey);
    return { nonce: c.nonce, expiresAt: c.expiresAt.toISOString() };
  });

  app.post("/verify", async (req, reply) => {
    const body = z
      .object({
        publicKey: PublicKeySchema,
        nonce: z.string().min(1),
        signature: z.string().min(1),
      })
      .parse(req.body);

    try {
      const result = await authenticateByChallenge(body);
      const token = await issueAccessToken({
        sub: result.accountId,
        pk: result.publicKey,
      });
      return {
        accessToken: token,
        account: {
          id: result.accountId,
          publicKey: result.publicKey,
          created: result.created,
        },
      };
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  // Optional passphrase recovery: upload encrypted seed blob.
  // Requires an access token — only the authenticated owner can set their own
  // backup. The server never sees the passphrase or the plaintext seed.
  app.post("/recovery/backup", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "missing bearer token" });
    }
    let claims;
    try {
      claims = await verifyAccessToken(auth.slice("Bearer ".length));
    } catch {
      return reply.code(401).send({ error: "invalid token" });
    }

    const body = z
      .object({
        recoveryId: z.string().min(16).max(64),
        ciphertext: z.string().min(1),
        kdfSalt: z.string().min(1),
        kdfParams: z.object({
          N: z.number().int().positive(),
          r: z.number().int().positive(),
          p: z.number().int().positive(),
          dkLen: z.literal(32),
        }),
      })
      .parse(req.body);

    await saveRecoveryBackup({ accountId: claims.sub, ...body });
    return { ok: true };
  });

  // Public recovery lookup. Recovery id is the secret; the ciphertext is
  // useless without the passphrase, so this endpoint does not require auth.
  // Rate limiting per recoveryId should be added before production.
  app.get("/recovery/:recoveryId", async (req, reply) => {
    const params = z.object({ recoveryId: z.string().min(16).max(64) }).parse(req.params);
    const backup = await getRecoveryBackup(params.recoveryId);
    if (!backup) return reply.code(404).send({ error: "not found" });
    return {
      ciphertext: backup.ciphertext,
      kdfSalt: backup.kdfSalt,
      kdfParams: backup.kdfParams,
    };
  });
}
