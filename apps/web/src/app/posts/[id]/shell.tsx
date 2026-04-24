"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { castVote, type FeedPost } from "@/lib/api";
import { loadAccessToken } from "@/lib/storage";

export function PostShell({ initialPost }: { initialPost: FeedPost }) {
  const [post, setPost] = useState<FeedPost>(initialPost);
  const [flash, setFlash] = useState("");

  async function handleVote(direction: 1 | -1) {
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setFlash("Sign in to vote.");
      return;
    }
    try {
      await castVote({ accessToken, postId: post.id, direction });
      const already = post.voteSummary.viewerVote;
      const delta = direction - (already ?? 0);
      setPost((p) => ({
        ...p,
        voteSummary: {
          ...p.voteSummary,
          score: p.voteSummary.score + delta,
          viewerVote: direction,
        },
      }));
      setFlash("");
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  return (
    <main style={styles.page}>
      <Link href="/" style={styles.backLink}>
        ← Back to feed
      </Link>

      <article style={styles.card}>
        <div style={styles.voteRail}>
          <button
            onClick={() => handleVote(1)}
            style={{
              ...styles.voteButton,
              ...(post.voteSummary.viewerVote === 1 ? styles.voteButtonActive : {}),
            }}
          >
            +
          </button>
          <strong style={styles.score}>{post.voteSummary.score}</strong>
          <button
            onClick={() => handleVote(-1)}
            style={{
              ...styles.voteButton,
              ...(post.voteSummary.viewerVote === -1 ? styles.voteButtonActive : {}),
            }}
          >
            −
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.meta}>
            <span>{post.author.publicKey.slice(0, 16)}…</span>
            <span>rep {post.author.reputationScore}</span>
            <span>{new Date(post.createdAt).toLocaleString()}</span>
            {post.business ? (
              <Link href={`/businesses/${post.business.slug}`} style={styles.businessChip}>
                {post.business.verified ? "Verified · " : ""}
                {post.business.name}
              </Link>
            ) : (
              <span style={styles.businessChipMuted}>General post</span>
            )}
          </div>

          <p style={styles.content}>{post.content}</p>

          <p style={styles.voteMeta}>
            {post.voteSummary.upvoteCount} upvote{post.voteSummary.upvoteCount !== 1 ? "s" : ""} ·{" "}
            {post.voteSummary.downvoteCount} downvote{post.voteSummary.downvoteCount !== 1 ? "s" : ""} ·
            weighted total {post.voteSummary.totalWeight}
          </p>

          {flash ? <p style={styles.flash}>{flash}</p> : null}
        </div>
      </article>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "32px 20px 64px",
  },
  backLink: {
    display: "inline-flex",
    marginBottom: 20,
    color: "var(--accent-dark)",
    fontWeight: 700,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr)",
    gap: 24,
    alignItems: "start",
    padding: 32,
    borderRadius: 28,
    border: "1px solid var(--line)",
    background: "var(--card)",
    boxShadow: "var(--shadow)",
  },
  voteRail: {
    display: "grid",
    justifyItems: "center",
    gap: 12,
    paddingTop: 6,
  },
  voteButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "white",
    cursor: "pointer",
    fontSize: 24,
    lineHeight: 1,
  },
  voteButtonActive: {
    background: "var(--accent-soft)",
    borderColor: "rgba(200,79,30,0.45)",
    color: "var(--accent-dark)",
  },
  score: {
    fontSize: 22,
  },
  body: {
    minWidth: 0,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    color: "var(--muted)",
    marginBottom: 18,
    fontSize: 14,
  },
  businessChip: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--accent-soft)",
    color: "var(--accent-dark)",
    fontWeight: 700,
  },
  businessChipMuted: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(54, 31, 16, 0.06)",
  },
  content: {
    margin: "0 0 20px",
    fontSize: 22,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  voteMeta: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 14,
  },
  flash: {
    marginTop: 12,
    color: "var(--accent)",
  },
};
