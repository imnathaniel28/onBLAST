import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken, type AccessClaims } from "../auth/jwt.js";

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AccessClaims | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "missing bearer token" });
    return null;
  }
  try {
    return await verifyAccessToken(auth.slice("Bearer ".length));
  } catch {
    reply.code(401).send({ error: "invalid token" });
    return null;
  }
}
