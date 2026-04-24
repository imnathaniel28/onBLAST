"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { castVote, fetchPosts, type AccountProfile, type FeedPost } from "@/lib/api";
import { loadAccessToken } from "@/lib/storage";

const DAY_MS = 86_400_000;

function accountAge(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function AccountShell({
  account,
  initialPosts,
  initialNextCursor,
}: {
  account: AccountProfile;
  initialPosts: FeedPost[];
  initialNextCursor: string | null;
}) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [flash, setFlash] = useState("");

  async function handleVote(postId: string, direction: 1 | -1) {
    const accessToken = loadAccessToken();
    if (!accessToken) { setFlash("Sign in to vote."); return; }
    try {
      await castVote({ accessToken, postId, direction });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const delta = direction - (p.voteSummary.viewerVote ?? 0);
          return { ...p, voteSummary: { ...p.voteSummary, score: p.voteSummary.score + delta, viewerVote: direction } };
        }),
      );
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor) return;
    try {
      const refreshed = await fetchPosts({
        authorId: account.id,
        cursor: nextCursor,
        accessToken: loadAccessToken() ?? undefined,
      });
      setPosts((prev) => [...prev, ...refreshed.posts]);
      setNextCursor(refreshed.nextCursor);
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  return (
    <main style={styles.page}>
      <Link href="/" style={styles.backLink}>← Back to feed</Link>

      <section style={styles.hero}>
        <p style={styles.eyebrow}>Account profile</p>
        <p style={styles.pubkey}>{account.publicKey}</p>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{account.reputationScore}</span>
            <span style={styles.statLabel}>reputation</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{account._count.posts}</span>
            <span style={styles.statLabel}>posts</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{account._count.petitionsOpened}</span>
            <span style={styles.statLabel}>petitions opened</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{account._count.petitionsTargeted}</span>
            <span style={styles.statLabel}>petitions against</span>
          </div>
        </div>
        <p style={styles.age}>Account created {accountAge(account.createdAt)}</p>
      </section>

      {flash ? <p style={styles.flash}>{flash}</p> : null}

      <section style={styles.feedSection}>
        <p style={styles.feedEyebrow}>Posts by this account</p>
        {posts.length === 0 ? (
          <div style={styles.emptyCard}>
            <strong>No posts yet.</strong>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} style={styles.postCard}>
              <div style={styles.voteRail}>
                <button
                  onClick={() => handleVote(post.id, 1)}
                  style={{ ...styles.voteButton, ...(post.voteSummary.viewerVote === 1 ? styles.voteButtonActive : {}) }}
                >+</button>
                <strong>{post.voteSummary.score}</strong>
                <button
                  onClick={() => handleVote(post.id, -1)}
                  style={{ ...styles.voteButton, ...(post.voteSummary.viewerVote === -1 ? styles.voteButtonActive : {}) }}
                >−</button>
              </div>
              <div style={styles.postBody}>
                <div style={styles.postMeta}>
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                  {post.business ? (
                    <Link href={`/businesses/${post.business.slug}`} style={styles.businessChip}>
                      {post.business.name}
                    </Link>
                  ) : (
                    <span style={styles.businessChipMuted}>General post</span>
                  )}
                </div>
                <p style={styles.postContent}>{post.content}</p>
                <div style={styles.postFooter}>
                  <span style={styles.voteMeta}>
                    {post.voteSummary.upvoteCount} up · {post.voteSummary.downvoteCount} down
                  </span>
                  <Link href={`/posts/${post.id}`} style={styles.permalinkLink}>Permalink</Link>
                </div>
              </div>
            </article>
          ))
        )}
        {nextCursor && (
          <button onClick={handleLoadMore} style={styles.loadMoreButton}>
            Load more posts
          </button>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 860, margin: "0 auto", padding: "32px 20px 64px" },
  backLink: { display: "inline-flex", marginBottom: 20, color: "var(--accent-dark)", fontWeight: 700 },
  hero: {
    background: "var(--card)", border: "1px solid var(--line)", borderRadius: 28,
    padding: 28, boxShadow: "var(--shadow)", marginBottom: 20,
  },
  eyebrow: {
    margin: "0 0 8px", textTransform: "uppercase" as const,
    letterSpacing: "0.12em", fontSize: 12, color: "var(--accent-dark)",
  },
  pubkey: {
    fontFamily: "monospace", fontSize: 15, wordBreak: "break-all" as const,
    margin: "0 0 20px", color: "var(--text)", lineHeight: 1.5,
  },
  stats: { display: "flex", flexWrap: "wrap" as const, gap: 24, marginBottom: 16 },
  stat: { display: "grid", gap: 2 },
  statValue: { fontSize: 32, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 13, color: "var(--muted)" },
  age: { margin: 0, color: "var(--muted)", fontSize: 13 },
  flash: { marginBottom: 16, color: "var(--accent)", fontWeight: 600 },
  feedSection: { display: "grid", gap: 14 },
  feedEyebrow: {
    margin: "0 0 4px", textTransform: "uppercase" as const,
    letterSpacing: "0.12em", fontSize: 12, color: "var(--accent-dark)",
  },
  emptyCard: {
    padding: 24, borderRadius: 24, background: "var(--card)",
    border: "1px solid var(--line)", boxShadow: "var(--shadow)",
  },
  postCard: {
    display: "grid", gridTemplateColumns: "64px minmax(0, 1fr)", gap: 18,
    alignItems: "start", padding: 20, borderRadius: 24,
    border: "1px solid var(--line)", background: "var(--card)", boxShadow: "var(--shadow)",
  },
  voteRail: { display: "grid", justifyItems: "center", gap: 8, paddingTop: 4 },
  voteButton: {
    width: 40, height: 40, borderRadius: 999, border: "1px solid var(--line)",
    background: "white", cursor: "pointer", fontSize: 20, lineHeight: 1,
  },
  voteButtonActive: {
    background: "var(--accent-soft)", borderColor: "rgba(200,79,30,0.45)", color: "var(--accent-dark)",
  },
  postBody: { minWidth: 0 },
  postMeta: {
    display: "flex", flexWrap: "wrap" as const, gap: 8, alignItems: "center",
    color: "var(--muted)", marginBottom: 10, fontSize: 13,
  },
  businessChip: {
    padding: "4px 8px", borderRadius: 999, background: "var(--accent-soft)",
    color: "var(--accent-dark)", fontWeight: 700,
  },
  businessChipMuted: { padding: "4px 8px", borderRadius: 999, background: "rgba(54,31,16,0.06)" },
  postContent: { margin: "0 0 12px", fontSize: 18, lineHeight: 1.6, whiteSpace: "pre-wrap" as const },
  postFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  voteMeta: { color: "var(--muted)", fontSize: 13 },
  permalinkLink: { fontSize: 13, color: "var(--accent-dark)", fontWeight: 700 },
  loadMoreButton: {
    border: "1px solid var(--line)", borderRadius: 999, background: "transparent",
    color: "var(--accent-dark)", padding: "10px 22px", fontWeight: 700,
    cursor: "pointer", fontSize: 14, display: "block", margin: "4px auto 0",
  },
};
