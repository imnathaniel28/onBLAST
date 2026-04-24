"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { createLegalDemand, fetchLegalDemands, type LegalDemand } from "@/lib/api";

const DEMAND_TYPES: LegalDemand["demandType"][] = [
  "DMCA",
  "DEFAMATION_CLAIM",
  "CEASE_AND_DESIST",
  "SUBPOENA",
  "COURT_ORDER",
  "LAW_ENFORCEMENT_REQUEST",
  "OTHER",
];

const TARGET_KINDS: LegalDemand["targetKind"][] = ["post", "account", "business"];

export function LegalDemandsShell({ initialDemands }: { initialDemands: LegalDemand[] }) {
  const [demands, setDemands] = useState<LegalDemand[]>(initialDemands);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [flash, setFlash] = useState("");
  const [isPending, setIsPending] = useState(false);

  const [demandType, setDemandType] = useState<LegalDemand["demandType"]>("DMCA");
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [targetKind, setTargetKind] = useState<LegalDemand["targetKind"]>("post");
  const [targetRef, setTargetRef] = useState("");
  const [summary, setSummary] = useState("");
  const [operatorKey, setOperatorKey] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!senderName.trim() || !targetRef.trim() || !summary.trim()) {
      setFlash("Sender name, target reference, and summary are required.");
      return;
    }
    setIsPending(true);
    try {
      await createLegalDemand({
        demandType,
        senderName: senderName.trim(),
        senderContact: senderContact.trim() || undefined,
        targetKind,
        targetRef: targetRef.trim(),
        summary: summary.trim(),
        operatorKey: operatorKey.trim() || undefined,
      });
      setFlash("Demand logged and published to the public record.");
      setShowForm(false);
      setSenderName("");
      setSenderContact("");
      setTargetRef("");
      setSummary("");
      const refreshed = await fetchLegalDemands();
      setDemands(refreshed);
    } catch (error) {
      setFlash((error as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main style={styles.page}>
      <Link href="/" style={styles.backLink}>
        ← Back to feed
      </Link>

      <section style={styles.header}>
        <p style={styles.eyebrow}>Transparency record</p>
        <h1 style={styles.title}>Legal Demands</h1>
        <p style={styles.lead}>
          Every legal demand received by onBLAST is logged here publicly — sender, target, and
          outcome. Modeled on the{" "}
          <span style={{ fontStyle: "italic" }}>Lumen Database</span> approach used by Google,
          Reddit, and others. This is the strongest practical deterrent against abuse of the legal
          process to silence criticism.
        </p>
        <p style={styles.policy}>
          Policy: every demand is challenged for specifics before any action. Takedown happens only
          on a valid court order — not on lawyer letters, not on DMCA claims, not on "we dislike
          this post."
        </p>
      </section>

      <div style={styles.actionRow}>
        <button
          onClick={() => { setShowForm((v) => !v); setFlash(""); }}
          style={styles.ghostButton}
        >
          {showForm ? "Cancel" : "Log incoming demand"}
        </button>
        <span style={styles.count}>{demands.length} on record</span>
      </div>

      {flash ? <p style={styles.flash}>{flash}</p> : null}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <p style={styles.formNote}>
            This form is for the designated intake agent. In production it will be gated to
            operator-only access. Every submission is immediately public.
          </p>
          <div style={styles.formGrid}>
            <label style={styles.label}>
              Demand type
              <select
                value={demandType}
                onChange={(e) => setDemandType(e.target.value as LegalDemand["demandType"])}
                style={styles.select}
              >
                {DEMAND_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Sender name (public)
              <input
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Law firm or individual name"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Sender contact (optional, public)
              <input
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
                placeholder="Email or address"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Target type
              <select
                value={targetKind}
                onChange={(e) => setTargetKind(e.target.value as LegalDemand["targetKind"])}
                style={styles.select}
              >
                {TARGET_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>

            <label style={styles.label}>
              Target reference (post ID, account ID, or business slug)
              <input
                required
                value={targetRef}
                onChange={(e) => setTargetRef(e.target.value)}
                placeholder="e.g. clxyz123…"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Operator key (required if OPERATOR_KEY env var is set)
              <input
                type="password"
                value={operatorKey}
                onChange={(e) => setOperatorKey(e.target.value)}
                placeholder="Leave blank in dev"
                style={styles.input}
              />
            </label>
          </div>

          <label style={styles.label}>
            Summary of demand (public)
            <textarea
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the demand in plain language…"
              style={styles.textarea}
            />
          </label>

          <button type="submit" disabled={isPending} style={styles.button}>
            Log and publish
          </button>
        </form>
      )}

      {demands.length === 0 ? (
        <div style={styles.emptyCard}>
          <strong>No demands on record yet.</strong>
          <p style={styles.helper}>When the first legal demand arrives, it will appear here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {demands.map((d) => (
            <div key={d.id} style={styles.row}>
              <div
                style={styles.rowHeader}
                onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
              >
                <div style={styles.rowLeft}>
                  <span style={styles.demandType}>{d.demandType.replace(/_/g, " ")}</span>
                  <span style={styles.sender}>{d.senderName}</span>
                  <span style={styles.target}>
                    → {d.targetKind} {d.targetRef.slice(0, 20)}{d.targetRef.length > 20 ? "…" : ""}
                  </span>
                </div>
                <div style={styles.rowRight}>
                  <StatusPill status={d.status} />
                  <span style={styles.date}>{new Date(d.receivedAt).toLocaleDateString()}</span>
                  <span style={styles.expand}>{expandedId === d.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expandedId === d.id && (
                <div style={styles.detail}>
                  <p style={styles.summaryText}>{d.summary}</p>
                  {d.senderContact ? (
                    <p style={styles.detailMeta}>Contact: {d.senderContact}</p>
                  ) : null}
                  {d.responseText ? (
                    <div style={styles.responseBlock}>
                      <p style={styles.detailLabel}>Platform response</p>
                      <p style={styles.summaryText}>{d.responseText}</p>
                    </div>
                  ) : null}
                  {d.outcome ? (
                    <p style={styles.detailMeta}>Outcome: {d.outcome}</p>
                  ) : null}
                  {d.closedAt ? (
                    <p style={styles.detailMeta}>Closed: {new Date(d.closedAt).toLocaleString()}</p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusPill({ status }: { status: LegalDemand["status"] }) {
  const colors: Record<LegalDemand["status"], string> = {
    RECEIVED: "var(--muted)",
    CHALLENGED: "#1d4ed8",
    COMPLIED: "var(--accent)",
    DENIED: "var(--success)",
    WITHDRAWN: "var(--muted)",
  };
  return (
    <span style={{ color: colors[status], fontWeight: 700, fontSize: 12 }}>
      {status}
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
  lead: { margin: "0 0 12px", fontSize: 17, lineHeight: 1.6, color: "var(--muted)", maxWidth: 700 },
  policy: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    padding: "12px 16px",
    background: "var(--accent-soft)",
    borderRadius: 12,
    borderLeft: "3px solid var(--accent)",
  },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ghostButton: {
    border: "1px solid var(--line)",
    borderRadius: 999,
    background: "transparent",
    color: "var(--accent-dark)",
    padding: "9px 18px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  count: { color: "var(--muted)", fontSize: 14 },
  flash: { marginBottom: 16, color: "var(--accent)", fontWeight: 600 },
  form: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "var(--shadow)",
    marginBottom: 20,
    display: "grid",
    gap: 16,
  },
  formNote: {
    margin: 0,
    fontSize: 13,
    color: "var(--muted)",
    lineHeight: 1.5,
    padding: "10px 14px",
    background: "rgba(54,31,16,0.05)",
    borderRadius: 10,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--muted)",
  },
  input: {
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
    padding: "9px 14px",
  },
  select: {
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
    padding: "9px 14px",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 16,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
    padding: 14,
    resize: "vertical" as const,
  },
  button: {
    border: 0,
    borderRadius: 999,
    background: "var(--accent)",
    color: "white",
    padding: "10px 22px",
    fontWeight: 700,
    cursor: "pointer",
    justifySelf: "start" as const,
  },
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
    padding: "16px 20px",
    cursor: "pointer",
    flexWrap: "wrap" as const,
  },
  rowLeft: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const },
  rowRight: { display: "flex", gap: 12, alignItems: "center" },
  demandType: {
    fontWeight: 700,
    fontSize: 13,
    background: "var(--accent-soft)",
    color: "var(--accent-dark)",
    padding: "4px 10px",
    borderRadius: 999,
  },
  sender: { fontWeight: 600, fontSize: 15 },
  target: { color: "var(--muted)", fontSize: 13, fontFamily: "monospace" },
  date: { color: "var(--muted)", fontSize: 13 },
  expand: { color: "var(--muted)", fontSize: 12 },
  detail: {
    padding: "0 20px 20px",
    borderTop: "1px solid var(--line)",
    display: "grid",
    gap: 10,
    paddingTop: 16,
  },
  summaryText: { margin: 0, lineHeight: 1.6, fontSize: 15, whiteSpace: "pre-wrap" as const },
  detailMeta: { margin: 0, color: "var(--muted)", fontSize: 13 },
  responseBlock: {
    padding: 14,
    background: "rgba(34,84,61,0.07)",
    borderRadius: 12,
    borderLeft: "3px solid var(--success)",
  },
  detailLabel: { margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: "var(--success)" },
};
