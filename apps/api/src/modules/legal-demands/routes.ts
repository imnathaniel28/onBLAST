import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { appendModerationLog } from "../moderation-log/service.js";
import { config } from "../../config.js";

function requireOperatorKey(req: FastifyRequest, reply: FastifyReply): boolean {
  if (!config.operatorKey) return true; // unset in dev — skip check
  if (req.headers["x-operator-key"] === config.operatorKey) return true;
  reply.code(403).send({ error: "invalid or missing operator key" });
  return false;
}

// Legal demand intake.
//
// Per app-idea.md > Notice-and-response workflow:
//   - Single intake channel
//   - Designated agent (not a mod) evaluates every demand
//   - Push back by default; takedown only on valid court order
//   - PUBLIC logging of every demand received (Lumen-style)
//   - User notice when demand targets a specific user
//
// This module stores the demand, its public metadata, and its outcome. It is
// NOT authenticated here — in production, intake should be gated to the
// designated agent (likely via a separate admin subsystem). Scaffolded as
// public routes so the data model + moderation-log integration are visible.

export async function legalDemandsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/", async (req, reply) => {
    if (!requireOperatorKey(req, reply)) return;
    const body = z
      .object({
        demandType: z.enum([
          "DMCA",
          "DEFAMATION_CLAIM",
          "CEASE_AND_DESIST",
          "SUBPOENA",
          "COURT_ORDER",
          "LAW_ENFORCEMENT_REQUEST",
          "OTHER",
        ]),
        senderName: z.string().min(1),
        senderContact: z.string().optional(),
        targetKind: z.enum(["post", "account", "business"]),
        targetRef: z.string().min(1),
        summary: z.string().min(1).max(10_000),
      })
      .parse(req.body);

    const demand = await prisma.legalDemand.create({ data: body });

    await appendModerationLog({
      entryType: "LEGAL_DEMAND",
      subjectKind: "legal_demand",
      subjectId: demand.id,
      action: "RECEIVED",
      details: {
        demandType: demand.demandType,
        senderName: demand.senderName,
        targetKind: demand.targetKind,
        targetRef: demand.targetRef,
      },
    });

    return demand;
  });

  app.get("/", async () => {
    // Public list. Lumen-style transparency.
    return prisma.legalDemand.findMany({
      orderBy: { receivedAt: "desc" },
      take: 100,
    });
  });
}
