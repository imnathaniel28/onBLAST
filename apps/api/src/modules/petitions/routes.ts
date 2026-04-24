import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { requireAuth } from "../../lib/require-auth.js";
import {
  canOpenPetition,
  petitionVoteWeight,
} from "../voting-weight/index.js";

// NOTE: This module is a scaffold. Threshold counts, quorum sizes, cooldown
// periods, and the 77% supermajority are intentionally NOT hard-coded yet —
// they are v1 tuning decisions per app-idea.md > "Still to decide".
// When those parameters are picked, the petition lifecycle (OPEN -> AT_VOTE
// -> PASSED/FAILED/COOLDOWN) should be driven by them here.

export async function petitionsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/", async (req, reply) => {
    const claims = await requireAuth(req, reply);
    if (!claims) return;
    const body = z
      .object({
        targetAccountId: z.string().min(1),
        reason: z.string().min(1).max(2000),
      })
      .parse(req.body);

    const opener = await prisma.account.findUnique({ where: { id: claims.sub } });
    if (!opener) return reply.code(404).send({ error: "account not found" });
    if (!canOpenPetition(opener)) {
      return reply.code(403).send({ error: "insufficient voting weight to open petition" });
    }

    return prisma.petition.create({
      data: {
        openerId: claims.sub,
        targetId: body.targetAccountId,
        reason: body.reason,
      },
    });
  });

  app.post("/:id/cosign", async (req, reply) => {
    const claims = await requireAuth(req, reply);
    if (!claims) return;
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    return prisma.petitionCosigner.create({
      data: { petitionId: params.id, accountId: claims.sub },
    });
  });

  app.post("/:id/vote", async (req, reply) => {
    const claims = await requireAuth(req, reply);
    if (!claims) return;
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = z.object({ ban: z.boolean() }).parse(req.body);

    const account = await prisma.account.findUnique({ where: { id: claims.sub } });
    if (!account) return reply.code(404).send({ error: "account not found" });
    const weight = petitionVoteWeight(account);
    if (weight <= 0) {
      return reply.code(403).send({ error: "insufficient voting weight" });
    }

    return prisma.petitionVote.upsert({
      where: { petitionId_voterId: { petitionId: params.id, voterId: claims.sub } },
      create: {
        petitionId: params.id,
        voterId: claims.sub,
        ban: body.ban,
        weight,
      },
      update: { ban: body.ban, weight },
    });
  });

  app.get("/", async () => {
    return prisma.petition.findMany({ orderBy: { openedAt: "desc" }, take: 50 });
  });
}
