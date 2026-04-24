// NCMEC CyberTipline submission — STUB.
//
// Real integration requires:
//   - Registration with NCMEC as an Electronic Service Provider (ESP)
//   - Production credentials for the CyberTipline API
//   - File-hash + content reporting formats per NCMEC spec
//   - Secure handling of the reported content (do NOT re-transmit it
//     anywhere beyond NCMEC; do not keep unnecessary copies)
//
// This stub exists so the reporting hook is wired end-to-end in the scaffold.
// DO NOT ship without replacing it.

import { prisma } from "../../db.js";

export async function submitToNcmec(reportId: string): Promise<void> {
  // TODO(compliance): implement CyberTipline submission. Until then, we
  // mark the report as pending and require manual escalation.
  await prisma.csamReport.update({
    where: { id: reportId },
    data: {
      // Left as PENDING_NCMEC_SUBMISSION on purpose. Production deployment
      // MUST NOT mark these SUBMITTED without an actual NCMEC confirmation.
      status: "PENDING_NCMEC_SUBMISSION",
    },
  });
}
