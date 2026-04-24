import { PrismaClient } from "@prisma/client";

// Logging is intentionally minimal. Query-level logging with parameters would
// be a PII vector (post content, public keys correlated with request time).
// Prefer metrics over logs in production.
export const prisma = new PrismaClient({
  log: ["warn", "error"],
});
