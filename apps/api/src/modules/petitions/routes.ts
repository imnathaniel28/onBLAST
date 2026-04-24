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

  app.get("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);

    const petition = await prisma.petition.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { cosigners: true, votes: true } },
        cosigners: {
          select: { accountId: true, createdAt: true },
          take: 50,
          orderBy: { createdAt: "asc" },
        },
        votes: { select: { ban: true, weight: true } },
      },
    });

    if (!petition) return reply.code(404).send({ error: "not found" });

    const banWeight = petition.votes.filter((v) => v.ban).reduce((s, v) => s + v.weight, 0);
    const keepWeight = petition.votes.filter((v) => !v.ban).reduce((s, v) => s + v.weight, 0);
    const totalWeight = banWeight + keepWeight;
    const banPercent = totalWeight > 0 ? Math.round((banWeight / totalWeight) * 100) : 0;

    return {
      id: petition.id,
      openerId: petition.openerId,
      targetId: petition.targetId,
      reason: petition.reason,
      status: petition.status,
      openedAt: petition.openedAt,
      closedAt: petition.closedAt,
      outcome: petition.outcome,
      _count: petition._count,
      cosigners: petition.cosigners,
      voteSummary: { banWeight, keepWeight, banPercent },
    };
  });

  app.get("/", async () => {
    const petitions = await prisma.petition.findMany({
      orderBy: { openedAt: "desc" },
      take: 50,
      include: {
        _count: {
          select: { cosigners: true, votes: true },
        },
      },
    });
    return petitions;
  });
}
