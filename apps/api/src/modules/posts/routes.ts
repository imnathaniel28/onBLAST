import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { requireAuth } from "../../lib/require-auth.js";
import { verifyAccessToken } from "../../auth/jwt.js";

async function getViewerIdFromAuthHeader(authHeader?: string): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const claims = await verifyAccessToken(authHeader.slice("Bearer ".length));
    return claims.sub;
  } catch {
    return null;
  }
}

export async function postsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (req) => {
    const query = z
      .object({
        businessId: z.string().optional(),
        authorId: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(req.query);

    const viewerId = await getViewerIdFromAuthHeader(req.headers.authorization);

    const raw = await prisma.post.findMany({
      where: {
        ...(query.businessId ? { businessId: query.businessId } : {}),
        ...(query.authorId ? { authorId: query.authorId } : {}),
      },
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, publicKey: true, reputationScore: true, createdAt: true } },
        business: { select: { id: true, slug: true, name: true, verified: true } },
        votes: { select: { voterId: true, direction: true, weight: true } },
      },
    });

    const hasMore = raw.length > query.limit;
    const page = raw.slice(0, query.limit);
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    const posts = page.map((post) => {
      const score = post.votes.reduce((sum, v) => sum + v.direction * v.weight, 0);
      const upvoteCount = post.votes.filter((v) => v.direction === 1).length;
      const downvoteCount = post.votes.filter((v) => v.direction === -1).length;
      const viewerVote = viewerId
        ? ((post.votes.find((v) => v.voterId === viewerId)?.direction ?? null) as 1 | -1 | null)
        : null;

      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        author: post.author,
        business: post.business,
        voteSummary: {
          score,
          upvoteCount,
          downvoteCount,
          totalWeight: post.votes.reduce((sum, v) => sum + v.weight, 0),
          viewerVote,
        },
      };
    });

    return { posts, nextCursor };
  });

  app.get("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const viewerId = await getViewerIdFromAuthHeader(req.headers.authorization);

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, publicKey: true, reputationScore: true, createdAt: true } },
        business: { select: { id: true, slug: true, name: true, verified: true } },
        votes: { select: { voterId: true, direction: true, weight: true } },
      },
    });

    if (!post) return reply.code(404).send({ error: "not found" });

    const score = post.votes.reduce((sum, v) => sum + v.direction * v.weight, 0);
    const upvoteCount = post.votes.filter((v) => v.direction === 1).length;
    const downvoteCount = post.votes.filter((v) => v.direction === -1).length;
    const viewerVote = viewerId
      ? ((post.votes.find((v) => v.voterId === viewerId)?.direction ?? null) as 1 | -1 | null)
      : null;

    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: post.author,
      business: post.business,
      voteSummary: {
        score,
        upvoteCount,
        downvoteCount,
        totalWeight: post.votes.reduce((sum, v) => sum + v.weight, 0),
        viewerVote,
      },
    };
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
