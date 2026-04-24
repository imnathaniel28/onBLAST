"use client";

import Link from "next/link";
import { useState, useEffect, type CSSProperties } from "react";
import {
  cosignPetition,
  votePetition,
  type PetitionDetail,
} from "@/lib/api";
import { loadAccessToken, currentAccountId } from "@/lib/storage";

export function PetitionShell({ initialPetition }: { initialPetition: PetitionDetail }) {
  const [petition, setPetition] = useState<PetitionDetail>(initialPetition);
  const [flash, setFlash] = useState("");
  const [viewerAccountId, setViewerAccountId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setViewerAccountId(currentAccountId());
  }, []);

  const hasCosigned = viewerAccountId
    ? petition.cosigners.some((cs) => cs.accountId === viewerAccountId)
    : false;

  async function handleCosign() {
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setFlash("Sign in first to cosign.");
      return;
    }
    setIsPending(true);
    try {
      await cosignPetition({ accessToken, petitionId: petition.id });
      setFlash("Cosigned.");
      setPetition((p) => ({
        ...p,
        _count: { ...p._count, cosigners: p._count.cosigners + 1 },
        cosigners: viewerAccountId
          ? [...p.cosigners, { accountId: viewerAccountId, createdAt: new Date().toISOString() }]
          : p.cosigners,
      }));
    } catch (error) {
      setFlash((error as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  async function handleVote(ban: boolean) {
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setFlash("Sign in first to vote.");
      return;
    }
    setIsPending(true);
    try {
      await votePetition({ accessToken, petitionId: petition.id, ban });
      setFlash(ban ? "Vote cast: ban." : "Vote cast: keep.");
      setPetition((p) => ({
        ...p,
        _count: { ...p._count, votes: p._count.votes + 1 },
      }));
    } catch (error) {
      setFlash((error as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  const { voteSummary } = petition;
  const totalWeight = voteSummary.banWeight + voteSummary.keepWeight;

  return (
    <main style={styles.page}>
      <Link href="/" style={styles.backLink}>
        ← Back to feed
      </Link>

      <section style={styles.hero}>
        <p style={styles.eyebrow}>
          Community petition · <StatusBadge status={petition.status} />
        </p>
        <p style={styles.subhead}>
          Opened {new Date(petition.openedAt).toLocaleString()}
          {petition.closedAt ? ` · Closed ${new Date(petition.closedAt).toLocaleString()}` : ""}
        </p>
        <blockquote style={styles.reason}>{petition.reason}</blockquote>
        <div style={styles.metaRow}>
          <span>Target: <span style={styles.mono}>{petition.targetId.slice(0, 16)}…</span></span>
          <span>Opened by: <span style={styles.mono}>{petition.openerId.slice(0, 16)}…</span></span>
          {petition.outcome ? <span>Outcome: {petition.outcome}</span> : null}
        </div>
      </section>

      {flash ? <p style={styles.flash}>{flash}</p> : null}

      {petition.status === "OPEN" && (
        <section style={styles.actionBar}>
          <div>
            <p style={styles.actionLabel}>Cosign this petition</p>
            <p style={styles.actionHint}>
              Cosigning shows community concern. Once enough cosigners accumulate, the petition advances to a vote.
            </p>
          </div>
          <button
            onClick={handleCosign}
            disabled={isPending || hasCosigned}
            style={{ ...styles.button, ...(hasCosigned ? styles.buttonDisabled : {}) }}
          >
            {hasCosigned ? "Cosigned" : "Cosign"}
          </button>
        </section>
      )}

      {petition.status === "AT_VOTE" && (
        <section style={styles.actionBar}>
          <div>
            <p style={styles.actionLabel}>Cast your vote</p>
            <p style={styles.actionHint}>
              77% supermajority (by weight) required to pass. Requires minimum account age and reputation.
            </p>
          </div>
          <div style={styles.voteButtons}>
            <button
              onClick={() => handleVote(true)}
              disabled={isPending}
              style={{ ...styles.button, ...styles.banButton }}
            >
              Vote to ban
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isPending}
              style={{ ...styles.button, ...styles.keepButton }}
            >
              Vote to keep
            </button>
          </div>
        </section>
      )}

      <div style={styles.grid}>
        <section style={styles.card}>
          <p style={styles.cardEyebrow}>Cosigners</p>
          <p style={styles.bigNumber}>{petition._count.cosigners}</p>
          {petition.cosigners.length === 0 ? (
            <p style={styles.helper}>No cosigners yet.</p>
          ) : (
            <ul style={styles.cosignerList}>
              {petition.cosigners.map((cs) => (
                <li key={cs.accountId} style={styles.cosignerItem}>
                  <span style={styles.mono}>{cs.accountId.slice(0, 16)}…</span>
                  <span style={styles.muted}>{new Date(cs.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
              {petition._count.cosigners > petition.cosigners.length ? (
                <li style={{ ...styles.cosignerItem, color: "var(--muted)" }}>
                  + {petition._count.cosigners - petition.cosigners.length} more
                </li>
              ) : null}
            </ul>
          )}
        </section>

        <section style={styles.card}>
          <p style={styles.cardEyebrow}>Vote tally</p>
          <p style={styles.bigNumber}>{petition._count.votes}</p>
          {petition._count.votes === 0 ? (
            <p style={styles.helper}>No votes cast yet.</p>
          ) : (
            <>
              <VoteBar banPercent={voteSummary.banPercent} />
              <div style={styles.voteNumbers}>
                <span style={{ color: "var(--accent)" }}>
                  Ban: {voteSummary.banWeight}w ({voteSummary.banPercent}%)
                </span>
                <span style={{ color: "var(--success)" }}>
                  Keep: {voteSummary.keepWeight}w ({totalWeight > 0 ? 100 - voteSummary.banPercent : 0}%)
                </span>
              </div>
              <p style={styles.helper}>77% supermajority required to pass.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: PetitionDetail["status"] }) {
  const colors: Record<PetitionDetail["status"], string> = {
    OPEN: "var(--accent-dark)",
    AT_VOTE: "#1d4ed8",
    PASSED: "var(--accent)",
    FAILED: "var(--muted)",
    COOLDOWN: "#92400e",
  };
  return <strong style={{ color: colors[status] }}>{status}</strong>;
}

function VoteBar({ banPercent }: { banPercent: number }) {
  return (
    <div style={styles.barTrack}>
      <div
        style={{
          ...styles.barFill,
          width: `${banPercent}%`,
          background: banPercent >= 77 ? "var(--accent)" : "var(--muted)",
        }}
      />
      <div style={styles.barThreshold} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 900, margin: "0 auto", padding: "32px 20px 64px" },
  backLink: { display: "inline-flex", marginBottom: 20, color: "var(--accent-dark)", fontWeight: 700 },
  hero: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 28,
    padding: 28,
    boxShadow: "var(--shadow)",
    marginBottom: 16,
  },
  eyebrow: {
    margin: "0 0 6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontSize: 12,
    color: "var(--accent-dark)",
  },
  subhead: { margin: "0 0 16px", color: "var(--muted)", fontSize: 14 },
  reason: {
    margin: "0 0 20px",
    fontSize: 20,
    lineHeight: 1.6,
    borderLeft: "3px solid var(--accent-soft)",
    paddingLeft: 16,
    whiteSpace: "pre-wrap" as const,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    color: "var(--muted)",
    fontSize: 13,
  },
  mono: { fontFamily: "monospace" },
  flash: { margin: "0 0 16px", color: "var(--accent)", fontWeight: 600 },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    padding: "20px 24px",
    boxShadow: "var(--shadow)",
    marginBottom: 16,
    flexWrap: "wrap" as const,
  },
  actionLabel: { margin: "0 0 4px", fontWeight: 700, fontSize: 16 },
  actionHint: { margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.5 },
  voteButtons: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  button: {
    border: 0,
    borderRadius: 999,
    background: "var(--accent)",
    color: "white",
    padding: "10px 20px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  buttonDisabled: {
    background: "rgba(54,31,16,0.12)",
    color: "var(--muted)",
    cursor: "default",
  },
  banButton: { background: "var(--accent)" },
  keepButton: { background: "var(--success)" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  card: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "var(--shadow)",
  },
  cardEyebrow: {
    margin: "0 0 8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontSize: 12,
    color: "var(--accent-dark)",
  },
  bigNumber: { margin: "0 0 16px", fontSize: 48, fontWeight: 700, lineHeight: 1 },
  helper: { margin: 0, color: "var(--muted)", lineHeight: 1.5 },
  cosignerList: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  cosignerItem: { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 },
  muted: { color: "var(--muted)" },
  barTrack: {
    position: "relative" as const,
    height: 12,
    background: "rgba(54,31,16,0.1)",
    borderRadius: 999,
    marginBottom: 12,
    overflow: "visible" as const,
  },
  barFill: { height: "100%", borderRadius: 999, transition: "width 0.3s ease" },
  barThreshold: {
    position: "absolute" as const,
    top: -4,
    bottom: -4,
    left: "77%",
    width: 2,
    background: "var(--accent-dark)",
    borderRadius: 999,
  },
  voteNumbers: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 12,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
};
