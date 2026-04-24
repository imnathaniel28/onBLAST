import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";

// Public read. The moderation log is one of the core transparency commitments
// of onBLAST: every mod action, every petition outcome, every legal demand.
export async function moderationLogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (req) => {
    const query = z
      .object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(req.query);

    const rows = await prisma.moderationLogEntry.findMany({
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
    });
    const nextCursor = rows.length > query.limit ? rows[query.limit]!.id : null;
    return {
      entries: rows.slice(0, query.limit),
      nextCursor,
    };
  });
}
