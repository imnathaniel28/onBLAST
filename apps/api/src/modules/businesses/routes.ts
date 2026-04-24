import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";

export async function businessesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => {
    return prisma.business.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  });

  app.get("/:slug", async (req, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(req.params);
    const b = await prisma.business.findUnique({ where: { slug: params.slug } });
    if (!b) return reply.code(404).send({ error: "not found" });
    return b;
  });
}
