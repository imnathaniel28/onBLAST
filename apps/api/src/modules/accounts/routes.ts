import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";

export async function accountsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);

    const account = await prisma.account.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        publicKey: true,
        reputationScore: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            petitionsOpened: true,
            petitionsTargeted: true,
          },
        },
      },
    });

    if (!account) return reply.code(404).send({ error: "not found" });
    return account;
  });
}
