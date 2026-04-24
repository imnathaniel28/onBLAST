"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { fetchModerationLog, type ModerationLogPage } from "@/lib/api";

type LogEntry = ModerationLogPage["entries"][number];

export function ModLogShell({
  initialEntries,
  initialNextCursor,
}: {
  initialEntries: LogEntry[];
  initialNextCursor: string | null;
}) {
  const [entries, setEntries] = useState<LogEntry[]>(initialEntries);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadMore() {
    if (!nextCursor) return;
    setIsLoading(true);
    try {
      const page = await fetchModerationLog(nextCursor);
      setEntries((prev) => [...prev, ...page.entries]);
      setNextCursor(page.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <Link href="/" style={styles.backLink}>
        ← Back to feed
      </Link>

      <section style={styles.header}>
        <p style={styles.eyebrow}>Transparency record</p>
        <h1 style={styles.title}>Moderation Log</h1>
        <p style={styles.lead}>
          Every hard-limit action, petition outcome, legal demand, and CSAM report submitted to
          NCMEC is recorded here publicly and permanently. No entry is ever deleted or edited.
          Moderators cannot remove content from this log.
        </p>
      </section>

      {entries.length === 0 ? (
        <div style={styles.emptyCard}>
          <strong>Nothing on record yet.</strong>
          <p style={styles.helper}>
            When any hard-limit action or legal demand is logged, it will appear here.
          </p>
        </div>
      ) : (
        <>
          <div style={styles.list}>
            {entries.map((entry) => (
              <div key={entry.id} style={styles.row}>
                <div
                  style={styles.rowHeader}
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div style={styles.rowLeft}>
                    <EntryTypePill type={entry.entryType} />
                    <span style={styles.action}>{entry.action}</span>
                    {entry.subjectKind ? (
                      <span style={styles.subject}>
                        {entry.subjectKind}:{" "}
                        <span style={styles.mono}>
                          {entry.subjectId?.slice(0, 14) ?? "—"}…
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <div style={styles.rowRight}>
                    <span style={styles.date}>{new Date(entry.createdAt).toLocaleString()}</span>
                    <span style={styles.expand}>{expandedId === entry.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expandedId === entry.id && (
                  <div style={styles.detail}>
                    <p style={styles.detailLabel}>Details</p>
                    <pre style={styles.detailJson}>
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={isLoading}
              style={styles.loadMoreButton}
            >
              {isLoading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </main>
  );
}

function EntryTypePill({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    MOD_ACTION: "var(--accent)",
    PETITION_OUTCOME: "#1d4ed8",
    LEGAL_DEMAND: "#92400e",
    CSAM_REPORT_SUBMITTED: "#7c3aed",
    SURVEILLANCE_UNLOCK: "#b91c1c",
  };
  const color = colorMap[type] ?? "var(--muted)";
  return (
    <span
      style={{
        fontWeight: 700,
        fontSize: 11,
        color,
        background: `${color}18`,
        padding: "4px 10px",
        borderRadius: 999,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
      }}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 900, margin: "0 auto", padding: "32px 20px 64px" },
  backLink: { display: "inline-flex", marginBottom: 20, color: "var(--accent-dark)", fontWeight: 700 },
  header: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 28,
    padding: 28,
    boxShadow: "var(--shadow)",
    marginBottom: 20,
  },
  eyebrow: {
    margin: "0 0 6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontSize: 12,
    color: "var(--accent-dark)",
  },
  title: { margin: "0 0 12px", fontSize: "clamp(2rem, 5vw, 3.6rem)", lineHeight: 1.05 },
  lead: { margin: 0, fontSize: 17, lineHeight: 1.6, color: "var(--muted)", maxWidth: 700 },
  emptyCard: {
    padding: 24,
    borderRadius: 24,
    background: "var(--card)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow)",
  },
  helper: { margin: "8px 0 0", color: "var(--muted)" },
  list: { display: "grid", gap: 10 },
  row: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "var(--shadow)",
  },
  rowHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    cursor: "pointer",
    flexWrap: "wrap" as const,
  },
  rowLeft: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const },
  rowRight: { display: "flex", gap: 10, alignItems: "center" },
  action: { fontWeight: 600, fontSize: 14 },
  subject: { color: "var(--muted)", fontSize: 13 },
  mono: { fontFamily: "monospace" },
  date: { color: "var(--muted)", fontSize: 13 },
  expand: { color: "var(--muted)", fontSize: 12 },
  detail: {
    padding: "14px 18px 18px",
    borderTop: "1px solid var(--line)",
  },
  detailLabel: {
    margin: "0 0 8px",
    fontWeight: 700,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "var(--muted)",
  },
  detailJson: {
    margin: 0,
    padding: "12px 14px",
    background: "rgba(54,31,16,0.05)",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "monospace",
    overflowX: "auto" as const,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
  },
  loadMoreButton: {
    marginTop: 20,
    border: "1px solid var(--line)",
    borderRadius: 999,
    background: "transparent",
    color: "var(--accent-dark)",
    padding: "10px 22px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
};
