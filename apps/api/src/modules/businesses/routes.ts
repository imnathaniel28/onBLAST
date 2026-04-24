import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { requireAuth } from "../../lib/require-auth.js";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function businessesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => {
    return prisma.business.findMany({
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });
  });

  app.post("/", async (req, reply) => {
    const claims = await requireAuth(req, reply);
    if (!claims) return;

    const body = z
      .object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens")
          .min(1)
          .max(80)
          .optional(),
      })
      .parse(req.body);

    const slug = body.slug ?? toSlug(body.name);
    if (!slug) {
      return reply.code(400).send({ error: "could not derive a valid slug from that name" });
    }

    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) {
      return reply.code(409).send({ error: "a business with that slug already exists" });
    }

    return reply.code(201).send(
      await prisma.business.create({
        data: { name: body.name, description: body.description, slug },
        include: { _count: { select: { posts: true } } },
      }),
    );
  });

  app.get("/:slug", async (req, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(req.params);
    const b = await prisma.business.findUnique({
      where: { slug: params.slug },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });
    if (!b) return reply.code(404).send({ error: "not found" });
    return b;
  });
}
