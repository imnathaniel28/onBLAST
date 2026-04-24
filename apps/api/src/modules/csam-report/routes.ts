import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { requireAuth } from "../../lib/require-auth.js";
import { appendModerationLog } from "../moderation-log/service.js";
import { submitToNcmec } from "./ncmec.js";

// CSAM reporting hook.
//
// 18 U.S.C. § 2258A requires mandatory reporting to NCMEC upon becoming
// aware of apparent CSAM. This is reactive — triggered by a user flag or mod
// review — not proactive scanning of user content. Per app-idea.md, this
// obligation OVERRIDES every other policy in the spec.
//
// This route queues a report and attempts NCMEC submission. The actual
// CyberTipline integration is stubbed in ./ncmec.ts and requires production
// NCMEC credentials to complete.

export async function csamRoutes(app: FastifyInstance): Promise<void> {
  app.post("/report", async (req, reply) => {
    const claims = await requireAuth(req, reply);
    if (!claims) return;
    const body = z
      .object({
        postId: z.string().min(1),
        triggerType: z.enum(["user_flag", "mod_review"]),
      })
      .parse(req.body);

    const report = await prisma.csamReport.create({
      data: {
        subjectPostId: body.postId,
        triggerType: body.triggerType,
        status: "PENDING_NCMEC_SUBMISSION",
      },
    });

    // Fire-and-forget submission attempt. In production this should be a
    // durable job queue; the legal obligation requires that we not silently
    // drop a report if the process dies between these two lines.
    void submitToNcmec(report.id).catch(() => {
      // TODO: alerting + persistent retry. This is a legal obligation,
      // not a best-effort delivery.
    });

    await appendModerationLog({
      entryType: "CSAM_REPORT_SUBMITTED",
      subjectKind: "csam_report",
      subjectId: report.id,
      action: "QUEUED",
      details: { triggerType: body.triggerType },
    });

    return { ok: true, reportId: report.id };
  });
}
