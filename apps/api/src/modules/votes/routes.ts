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

    const [account, post, existingVote] = await Promise.all([
      prisma.account.findUnique({ where: { id: claims.sub } }),
      prisma.post.findUnique({ where: { id: body.postId }, select: { id: true, authorId: true } }),
      prisma.vote.findUnique({
        where: { postId_voterId: { postId: body.postId, voterId: claims.sub } },
        select: { direction: true },
      }),
    ]);
    if (!account) return reply.code(404).send({ error: "account not found" });
    if (!post) return reply.code(404).send({ error: "post not found" });

    const weight = contentVoteWeight({
      createdAt: account.createdAt,
      reputationScore: account.reputationScore,
    });

    if (weight <= 0) {
      return reply.code(403).send({ error: "account has no voting weight yet" });
    }

    const upserted = await prisma.vote.upsert({
      where: { postId_voterId: { postId: body.postId, voterId: claims.sub } },
      create: {
        postId: body.postId,
        voterId: claims.sub,
        direction: body.direction,
        weight,
      },
      update: { direction: body.direction, weight },
    });

    // Update post author reputation. Voters cannot boost their own rep.
    // repDelta: new direction minus previous direction (0 if no prior vote).
    const repDelta = body.direction - (existingVote?.direction ?? 0);
    if (repDelta !== 0 && post.authorId !== claims.sub) {
      await prisma.account.update({
        where: { id: post.authorId },
        data: { reputationScore: { increment: repDelta } },
      });
    }

    return upserted;
  });
}
