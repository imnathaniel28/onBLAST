import { prisma } from "../../db.js";
import type { ModLogEntryType } from "@prisma/client";

export interface LogEntryInput {
  entryType: ModLogEntryType;
  subjectKind?: string;
  subjectId?: string;
  action: string;
  // Structured details. MUST NOT contain PII. Only ids, counts, aggregates.
  details: Record<string, unknown>;
}

export async function appendModerationLog(entry: LogEntryInput): Promise<void> {
  await prisma.moderationLogEntry.create({
    data: {
      entryType: entry.entryType,
      subjectKind: entry.subjectKind,
      subjectId: entry.subjectId,
      action: entry.action,
      details: entry.details as object,
    },
  });
}
