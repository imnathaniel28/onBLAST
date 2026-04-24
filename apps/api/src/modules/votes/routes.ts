import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { requireAuth } from "../../lib/require-auth.js";
import { contentVoteWeight } from "../voting-weight/index.js";

export async function votesRoutes(app: FastifyInstance): Promise<void> {
  app.post("/", async (req, reply) => {
    const claims = await requireAuth(req, reply);
    if (!claims) return;
    const body = z
      .object({
        postId: z.string().min(1),
        direction: z.union([z.literal(1), z.literal(-1)]),
      })
      .parse(req.body);

    const account = await prisma.account.findUnique({ where: { id: claims.sub } });
    if (!account) return reply.code(404).send({ error: "account not found" });

    const weight = contentVoteWeight({
      createdAt: account.createdAt,
      reputationScore: account.reputationScore,
    });

    return prisma.vote.upsert({
      where: { postId_voterId: { postId: body.postId, voterId: claims.sub } },
      create: {
        postId: body.postId,
        voterId: claims.sub,
        direction: body.direction,
        weight,
      },
      update: { direction: body.direction, weight },
    });
  });
}
