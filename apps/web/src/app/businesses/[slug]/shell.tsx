"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { castVote, createPost, fetchPosts, type BusinessSummary, type FeedPost } from "@/lib/api";
import { loadAccessToken } from "@/lib/storage";

export function BusinessShell(props: {
  business: BusinessSummary;
  initialPosts: FeedPost[];
  initialNextCursor: string | null;
}) {
  const [posts, setPosts] = useState<FeedPost[]>(props.initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(props.initialNextCursor);
  const [flash, setFlash] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const [composerFlash, setComposerFlash] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  async function handlePost(event: React.FormEvent) {
    event.preventDefault();
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setComposerFlash("Sign in first to post.");
      return;
    }
    const content = draft.trim();
    if (!content) {
      setComposerFlash("Write something first.");
      return;
    }
    setIsPosting(true);
    try {
      await createPost({ accessToken, content, businessId: props.business.id });
      setDraft("");
      setComposerFlash("Posted.");
      setShowComposer(false);
      const refreshed = await fetchPosts({ businessId: props.business.id, accessToken });
      setPosts(refreshed.posts);
      setNextCursor(refreshed.nextCursor);
      setFlash("");
    } catch (error) {
      setComposerFlash((error as Error).message);
    } finally {
      setIsPosting(false);
    }
  }

  async function handleVote(postId: string, direction: 1 | -1) {
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setFlash("Sign in to vote.");
      return;
    }
    try {
      await castVote({ accessToken, postId, direction });
      // Optimistic score update while we wait for a refresh
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const already = p.voteSummary.viewerVote;
          const delta = direction - (already ?? 0);
          return {
            ...p,
            voteSummary: {
              ...p.voteSummary,
              score: p.voteSummary.score + delta,
              viewerVote: direction,
            },
          };
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
        businessId: props.business.id,
        cursor: nextCursor,
        accessToken: loadAccessToken() ?? undefined,
      });
      setPosts((prev) => [...prev, ...refreshed.posts]);
      setNextCursor(refreshed.nextCursor);
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  const { business } = props;

  return (
    <main style={styles.page}>
      <Link href="/" style={styles.backLink}>
        ← Back to feed
      </Link>

      <section style={styles.hero}>
        <p style={styles.eyebrow}>Business profile</p>
        <h1 style={styles.title}>{business.name}</h1>
        <p style={styles.description}>
          {business.description || "No business-supplied description is published yet."}
        </p>
        <div style={styles.metaRow}>
          <span>{business.verified ? "Verified business account enabled" : "Unverified listing"}</span>
          <span>{business._count.posts} public posts</span>
        </div>
      </section>

      <div style={styles.composerRow}>
        <button
          onClick={() => { setShowComposer((v) => !v); setComposerFlash(""); }}
          style={styles.composerToggle}
        >
          {showComposer ? "Cancel" : "+ Post here"}
        </button>
      </div>

      {showComposer && (
        <form onSubmit={handlePost} style={styles.composerForm}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`What happened with ${props.business.name}?`}
            style={styles.textarea}
          />
          <div style={styles.composerFooter}>
            <p style={styles.helper}>Public, anonymous, permanent.</p>
            <button type="submit" disabled={isPosting} style={styles.button}>
              Publish
            </button>
          </div>
          {composerFlash ? <p style={styles.flash}>{composerFlash}</p> : null}
        </form>
      )}

      {flash ? <p style={{ ...styles.flash, marginBottom: 12 }}>{flash}</p> : null}

      <section style={styles.list}>
        {posts.length === 0 ? (
          <div style={styles.emptyCard}>
            <strong>No posts yet.</strong>
            <p style={styles.emptyText}>
              Return to the home feed to start the first public thread for this business.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} style={styles.postCard}>
              <div style={styles.postVoteRail}>
                <button
                  onClick={() => handleVote(post.id, 1)}
                  style={{
                    ...styles.voteButton,
                    ...(post.voteSummary.viewerVote === 1 ? styles.voteButtonActive : {}),
                  }}
                >
                  +
                </button>
                <strong>{post.voteSummary.score}</strong>
                <button
                  onClick={() => handleVote(post.id, -1)}
                  style={{
                    ...styles.voteButton,
                    ...(post.voteSummary.viewerVote === -1 ? styles.voteButtonActive : {}),
                  }}
                >
                  −
                </button>
              </div>

              <div style={styles.postBody}>
                <div style={styles.postMeta}>
                  <span>{post.author.publicKey.slice(0, 12)}…</span>
                  <span>rep {post.author.reputationScore}</span>
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <p style={styles.postContent}>{post.content}</p>
                <div style={styles.postFooter}>
                  <p style={styles.voteMeta}>
                    {post.voteSummary.upvoteCount} up · {post.voteSummary.downvoteCount} down ·
                    weighted total {post.voteSummary.totalWeight}
                  </p>
                  <Link href={`/posts/${post.id}`} style={styles.permalinkLink}>
                    Permalink
                  </Link>
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
  page: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 20px 64px",
  },
  backLink: {
    display: "inline-flex",
    marginBottom: 16,
    color: "var(--accent-dark)",
    fontWeight: 700,
  },
  hero: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 28,
    padding: 28,
    boxShadow: "var(--shadow)",
    marginBottom: 20,
  },
  eyebrow: {
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: 12,
    color: "var(--accent-dark)",
  },
  title: {
    margin: "0 0 12px",
    fontSize: "clamp(2.4rem, 5vw, 4rem)",
    lineHeight: 1,
  },
  description: {
    margin: "0 0 16px",
    color: "var(--muted)",
    fontSize: 18,
    lineHeight: 1.6,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    color: "var(--muted)",
  },
  flash: {
    marginTop: 10,
    color: "var(--accent)",
  },
  composerRow: {
    marginBottom: 14,
  },
  composerToggle: {
    border: "1px solid var(--line)",
    borderRadius: 999,
    background: "transparent",
    color: "var(--accent-dark)",
    padding: "9px 18px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  composerForm: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "var(--shadow)",
    marginBottom: 16,
    display: "grid",
    gap: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    borderRadius: 16,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
    padding: 14,
    resize: "vertical" as const,
  },
  composerFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  helper: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 14,
  },
  button: {
    border: 0,
    borderRadius: 999,
    background: "var(--accent)",
    color: "white",
    padding: "10px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gap: 14,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 24,
    background: "var(--card)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow)",
  },
  emptyText: {
    color: "var(--muted)",
    marginBottom: 0,
  },
  postCard: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr)",
    gap: 18,
    alignItems: "start",
    padding: 22,
    borderRadius: 24,
    border: "1px solid var(--line)",
    background: "var(--card)",
    boxShadow: "var(--shadow)",
  },
  postVoteRail: {
    display: "grid",
    justifyItems: "center",
    gap: 10,
    paddingTop: 4,
  },
  voteButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "white",
    cursor: "pointer",
    fontSize: 22,
    lineHeight: 1,
  },
  voteButtonActive: {
    background: "var(--accent-soft)",
    borderColor: "rgba(200,79,30,0.45)",
    color: "var(--accent-dark)",
  },
  postBody: {
    minWidth: 0,
  },
  postMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    color: "var(--muted)",
    marginBottom: 12,
    fontSize: 14,
  },
  postContent: {
    margin: "0 0 12px",
    whiteSpace: "pre-wrap",
    fontSize: 19,
    lineHeight: 1.6,
  },
  voteMeta: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 14,
  },
  postFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  permalinkLink: {
    fontSize: 13,
    color: "var(--accent-dark)",
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  },
  loadMoreButton: {
    border: "1px solid var(--line)",
    borderRadius: 999,
    background: "transparent",
    color: "var(--accent-dark)",
    padding: "10px 22px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    display: "block",
    margin: "4px auto 0",
  },
};
