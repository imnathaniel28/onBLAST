import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { requireAuth } from "../../lib/require-auth.js";

export async function postsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (req) => {
    const query = z
      .object({
        businessId: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(req.query);
    return prisma.post.findMany({
      where: { businessId: query.businessId },
      take: query.limit,
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/", async (req, reply) => {
    const claims = await requireAuth(req, reply);
    if (!claims) return;
    const body = z
      .object({
        content: z.string().min(1).max(10_000),
        businessId: z.string().optional(),
      })
      .parse(req.body);
    return prisma.post.create({
      data: {
        content: body.content,
        businessId: body.businessId,
        authorId: claims.sub,
      },
    });
  });
}
