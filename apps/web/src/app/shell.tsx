"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type CSSProperties } from "react";
import {
  castVote,
  createBusiness,
  createPost,
  fetchBusinesses,
  fetchPosts,
  type BusinessSummary,
  type FeedPost,
  type ModerationLogPage,
  type PetitionSummary,
} from "@/lib/api";
import { loadAccessToken, loadKeypair } from "@/lib/storage";
import { publicKeyToId } from "@onblast/crypto";

export function HomeShell(props: {
  initialBusinesses: BusinessSummary[];
  initialPosts: FeedPost[];
  initialNextCursor: string | null;
  initialModerationEntries: ModerationLogPage["entries"];
  initialPetitions: PetitionSummary[];
}) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [businesses, setBusinesses] = useState<BusinessSummary[]>(props.initialBusinesses);
  const [posts, setPosts] = useState<FeedPost[]>(props.initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(props.initialNextCursor);
  const [draft, setDraft] = useState("");
  const [sessionPublicKey, setSessionPublicKey] = useState<string | null>(null);
  const [flash, setFlash] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Create-business form
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [bizFlash, setBizFlash] = useState("");
  const [bizSearch, setBizSearch] = useState("");

  useEffect(() => {
    const keypair = loadKeypair();
    if (!keypair) return;
    setSessionPublicKey(publicKeyToId(keypair.publicKey));
  }, []);

  useEffect(() => {
    setNextCursor(null);
    startTransition(() => {
      void (async () => {
        try {
          const refreshed = await fetchPosts({
            businessId: selectedBusinessId || undefined,
            accessToken: loadAccessToken() ?? undefined,
          });
          setPosts(refreshed.posts);
          setNextCursor(refreshed.nextCursor);
        } catch (error) {
          setFlash((error as Error).message);
        }
      })();
    });
  }, [selectedBusinessId]);

  async function handleSubmit() {
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setFlash("Sign in first to post.");
      return;
    }

    const content = draft.trim();
    if (!content) {
      setFlash("Write something first.");
      return;
    }

    try {
      await createPost({
        accessToken,
        content,
        businessId: selectedBusinessId || undefined,
      });
      setDraft("");
      setFlash("Post published.");
      const refreshed = await fetchPosts({
        businessId: selectedBusinessId || undefined,
        accessToken,
      });
      setPosts(refreshed.posts);
      setNextCursor(refreshed.nextCursor);
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  async function handleVote(postId: string, direction: 1 | -1) {
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setFlash("Sign in first to vote.");
      return;
    }

    try {
      await castVote({ accessToken, postId, direction });
      const refreshed = await fetchPosts({
        businessId: selectedBusinessId || undefined,
        accessToken,
      });
      setPosts(refreshed.posts);
      setNextCursor(refreshed.nextCursor);
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor) return;
    try {
      const refreshed = await fetchPosts({
        businessId: selectedBusinessId || undefined,
        cursor: nextCursor,
        accessToken: loadAccessToken() ?? undefined,
      });
      setPosts((prev) => [...prev, ...refreshed.posts]);
      setNextCursor(refreshed.nextCursor);
    } catch (error) {
      setFlash((error as Error).message);
    }
  }

  async function handleCreateBusiness(event: React.FormEvent) {
    event.preventDefault();
    const accessToken = loadAccessToken();
    if (!accessToken) {
      setBizFlash("Sign in first to list a business.");
      return;
    }
    const name = bizName.trim();
    if (!name) {
      setBizFlash("Business name is required.");
      return;
    }
    try {
      const created = await createBusiness({
        accessToken,
        name,
        description: bizDesc.trim() || undefined,
      });
      setBizName("");
      setBizDesc("");
      setBizFlash(`"${created.name}" listed successfully.`);
      setShowCreateBusiness(false);
      const refreshed = await fetchBusinesses();
      setBusinesses(refreshed);
    } catch (error) {
      setBizFlash((error as Error).message);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroCopy}>
          <p style={styles.eyebrow}>Community-driven business accountability</p>
          <h1 style={styles.title}>Speak plainly. Keep the receipts public. Let the community decide.</h1>
          <p style={styles.lead}>
            onBLAST keeps criticism visible, keeps moderation transparent, and avoids collecting
            personal data by default.
          </p>
        </div>

        <div style={styles.heroCard}>
          <div style={styles.heroStat}>
            <span style={styles.heroStatValue}>{businesses.length}</span>
            <span style={styles.heroStatLabel}>tracked businesses</span>
          </div>
          <div style={styles.heroStat}>
            <span style={styles.heroStatValue}>{posts.length}</span>
            <span style={styles.heroStatLabel}>recent public posts</span>
          </div>
          <div style={styles.sessionBox}>
            <p style={styles.sessionLabel}>Session</p>
            <p style={styles.sessionValue}>
              {sessionPublicKey ? `${sessionPublicKey.slice(0, 16)}…` : "anonymous reader"}
            </p>
            <Link href="/auth" style={styles.primaryLink}>
              {sessionPublicKey ? "Manage keypair" : "Create pseudonymous account"}
            </Link>
          </div>
        </div>
      </section>

      <section style={styles.layout}>
        <div style={styles.mainColumn}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelEyebrow}>Post a report</p>
                <h2 style={styles.panelTitle}>Public by default</h2>
              </div>
              <select
                value={selectedBusinessId}
                onChange={(event) => setSelectedBusinessId(event.target.value)}
                style={styles.select}
              >
                <option value="">General feed</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What happened? What should other people know?"
              style={styles.textarea}
            />
            <div style={styles.formFooter}>
              <p style={styles.helper}>
                No email. No phone. No private moderation queue for opinions.
              </p>
              <button onClick={handleSubmit} style={styles.button} disabled={isPending}>
                Publish
              </button>
            </div>
            {flash ? <p style={styles.flash}>{flash}</p> : null}
          </section>

          <section style={styles.feedSection}>
            <div style={styles.feedHeader}>
              <div>
                <p style={styles.panelEyebrow}>Live feed</p>
                <h2 style={styles.panelTitle}>
                  {selectedBusinessId ? "Business thread" : "All recent posts"}
                </h2>
              </div>
              <span style={styles.helper}>{isPending ? "Refreshing…" : `${posts.length} visible`}</span>
            </div>

            {posts.map((post) => (
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
                    <Link href={`/accounts/${post.author.id}`} style={styles.authorLink}>
                      {post.author.publicKey.slice(0, 12)}…
                    </Link>
                    <span>rep {post.author.reputationScore}</span>
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                    {post.business ? (
                      <Link href={`/businesses/${post.business.slug}`} style={styles.businessChip}>
                        {post.business.verified ? "Verified " : ""}
                        {post.business.name}
                      </Link>
                    ) : (
                      <span style={styles.businessChipMuted}>General post</span>
                    )}
                  </div>
                  <p style={styles.postContent}>{post.content}</p>
                  <div style={styles.postFooter}>
                    <p style={styles.voteMeta}>
                      {post.voteSummary.upvoteCount} upvotes, {post.voteSummary.downvoteCount} downvotes,
                      weighted total {post.voteSummary.totalWeight}
                    </p>
                    <Link href={`/posts/${post.id}`} style={styles.permalinkLink}>
                      Permalink
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            {nextCursor && (
              <button onClick={handleLoadMore} style={styles.loadMoreButton}>
                Load more posts
              </button>
            )}
          </section>
        </div>

        <aside style={styles.sideColumn}>
          <section style={styles.sidePanel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelEyebrow}>Businesses</p>
                <h2 style={styles.panelTitle}>Browse targets</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateBusiness((v) => !v);
                  setBizFlash("");
                }}
                style={styles.ghostButton}
              >
                {showCreateBusiness ? "Cancel" : "+ List one"}
              </button>
            </div>

            {showCreateBusiness ? (
              <form onSubmit={handleCreateBusiness} style={styles.inlineForm}>
                <input
                  required
                  placeholder="Business name"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  style={styles.input}
                />
                <input
                  placeholder="Short description (optional)"
                  value={bizDesc}
                  onChange={(e) => setBizDesc(e.target.value)}
                  style={styles.input}
                />
                <button type="submit" style={styles.button}>
                  List business
                </button>
                {bizFlash ? <p style={styles.flash}>{bizFlash}</p> : null}
              </form>
            ) : null}

            <input
              type="search"
              placeholder="Search businesses…"
              value={bizSearch}
              onChange={(e) => setBizSearch(e.target.value)}
              style={styles.searchInput}
            />

            <div style={styles.businessList}>
              {(() => {
                const filtered = bizSearch.trim()
                  ? businesses.filter((b) =>
                      b.name.toLowerCase().includes(bizSearch.toLowerCase()),
                    )
                  : businesses;
                if (filtered.length === 0) {
                  return (
                    <p style={styles.helper}>
                      {bizSearch.trim() ? "No match." : "No businesses listed yet. Be the first."}
                    </p>
                  );
                }
                return filtered.map((business) => (
                  <Link key={business.id} href={`/businesses/${business.slug}`} style={styles.businessCard}>
                    <div style={styles.businessCardHeader}>
                      <strong>{business.name}</strong>
                      {business.verified ? <span style={styles.verifiedBadge}>verified</span> : null}
                    </div>
                    <p style={styles.businessDescription}>
                      {business.description || "No profile copy yet."}
                    </p>
                    <p style={styles.businessMeta}>{business._count.posts} public posts</p>
                  </Link>
                ));
              })()}
            </div>
          </section>

          <section style={styles.sidePanel}>
            <p style={styles.panelEyebrow}>Active petitions</p>
            <h2 style={styles.panelTitle}>Community votes</h2>
            <div style={styles.logList}>
              {props.initialPetitions.length === 0 ? (
                <p style={styles.helper}>
                  No petitions open. Accounts need 30+ days of activity before petition weight accrues.
                </p>
              ) : (
                props.initialPetitions.map((petition) => (
                  <div key={petition.id} style={styles.logRow}>
                    <div style={styles.logRowTop}>
                      <strong style={petitionStatusColor(petition.status)}>{petition.status}</strong>
                      <span>{new Date(petition.openedAt).toLocaleString()}</span>
                    </div>
                    <p style={styles.logAction}>{petition.reason.slice(0, 140)}{petition.reason.length > 140 ? "…" : ""}</p>
                    <div style={styles.petitionFooter}>
                      <span style={styles.voteMeta}>
                        {petition._count.cosigners} cosigner{petition._count.cosigners !== 1 ? "s" : ""} ·{" "}
                        {petition._count.votes} vote{petition._count.votes !== 1 ? "s" : ""}
                      </span>
                      <Link href={`/petitions/${petition.id}`} style={styles.permalinkLink}>
                        Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={styles.sidePanel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelEyebrow}>Moderation log</p>
                <h2 style={styles.panelTitle}>Public enforcement trail</h2>
              </div>
              <Link href="/moderation-log" style={styles.ghostButton}>Full log</Link>
            </div>
            <div style={styles.logList}>
              {props.initialModerationEntries.length === 0 ? (
                <p style={styles.helper}>No hard-limit actions or legal demands logged yet.</p>
              ) : (
                props.initialModerationEntries.map((entry) => (
                  <div key={entry.id} style={styles.logRow}>
                    <div style={styles.logRowTop}>
                      <strong>{entry.entryType}</strong>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={styles.logAction}>{entry.action}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "32px 20px 64px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 24,
    alignItems: "stretch",
    marginBottom: 24,
  },
  heroCopy: {
    background: "linear-gradient(135deg, rgba(255,249,239,0.92), rgba(247,232,210,0.92))",
    border: "1px solid var(--line)",
    borderRadius: 28,
    padding: 32,
    boxShadow: "var(--shadow)",
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: 12,
    color: "var(--accent-dark)",
    margin: "0 0 12px",
  },
  title: {
    fontSize: "clamp(2.6rem, 6vw, 5.3rem)",
    lineHeight: 0.96,
    margin: "0 0 16px",
    maxWidth: 720,
  },
  lead: {
    fontSize: 18,
    lineHeight: 1.6,
    color: "var(--muted)",
    maxWidth: 640,
    margin: 0,
  },
  heroCard: {
    background: "linear-gradient(180deg, rgba(96,39,19,0.96), rgba(56,23,12,0.96))",
    color: "#fff7f0",
    borderRadius: 28,
    padding: 24,
    display: "grid",
    gap: 16,
    boxShadow: "var(--shadow)",
  },
  heroStat: {
    display: "grid",
    gap: 4,
  },
  heroStatValue: {
    fontSize: 36,
    fontWeight: 700,
  },
  heroStatLabel: {
    color: "rgba(255,247,240,0.72)",
  },
  sessionBox: {
    marginTop: "auto",
    paddingTop: 16,
    borderTop: "1px solid rgba(255,247,240,0.18)",
  },
  sessionLabel: {
    margin: "0 0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: 12,
    color: "rgba(255,247,240,0.64)",
  },
  sessionValue: {
    margin: "0 0 16px",
    fontSize: 18,
  },
  primaryLink: {
    display: "inline-flex",
    padding: "12px 16px",
    borderRadius: 999,
    background: "#f59c4b",
    color: "#351707",
    fontWeight: 700,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
    alignItems: "start",
  },
  mainColumn: {
    display: "grid",
    gap: 20,
  },
  panel: {
    background: "var(--card)",
    backdropFilter: "blur(16px)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "var(--shadow)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  panelEyebrow: {
    margin: "0 0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: 12,
    color: "var(--accent-dark)",
  },
  panelTitle: {
    margin: 0,
    fontSize: 28,
  },
  select: {
    minWidth: 200,
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "var(--card-strong)",
    padding: "10px 14px",
  },
  textarea: {
    width: "100%",
    minHeight: 180,
    borderRadius: 20,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
    padding: 16,
    resize: "vertical",
  },
  formFooter: {
    marginTop: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  helper: {
    margin: 0,
    color: "var(--muted)",
    lineHeight: 1.5,
  },
  button: {
    border: 0,
    borderRadius: 999,
    background: "var(--accent)",
    color: "white",
    padding: "12px 22px",
    fontWeight: 700,
    cursor: "pointer",
  },
  flash: {
    marginTop: 12,
    color: "var(--success)",
  },
  feedSection: {
    display: "grid",
    gap: 14,
  },
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "end",
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
  postContent: {
    margin: "0 0 14px",
    fontSize: 20,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  voteMeta: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 14,
  },
  sideColumn: {
    display: "grid",
    gap: 20,
  },
  sidePanel: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "var(--shadow)",
  },
  searchInput: {
    width: "100%",
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
    padding: "9px 14px",
    marginBottom: 10,
  },
  businessList: {
    display: "grid",
    gap: 12,
  },
  businessCard: {
    display: "grid",
    gap: 8,
    padding: 16,
    background: "var(--card-strong)",
    borderRadius: 18,
    border: "1px solid rgba(54, 31, 16, 0.1)",
  },
  businessCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  verifiedBadge: {
    borderRadius: 999,
    background: "rgba(34,84,61,0.12)",
    color: "var(--success)",
    padding: "4px 8px",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  businessDescription: {
    margin: 0,
    color: "var(--muted)",
    lineHeight: 1.45,
  },
  businessMeta: {
    margin: 0,
    color: "var(--accent-dark)",
    fontWeight: 700,
  },
  logList: {
    display: "grid",
    gap: 12,
  },
  logRow: {
    padding: 14,
    borderRadius: 18,
    background: "var(--card-strong)",
    border: "1px solid rgba(54, 31, 16, 0.1)",
  },
  logRowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "var(--muted)",
    fontSize: 13,
    marginBottom: 8,
  },
  logAction: {
    margin: 0,
    fontSize: 15,
  },
  authorLink: {
    color: "var(--muted)",
    fontFamily: "monospace",
    fontSize: 13,
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
  postFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  petitionFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  permalinkLink: {
    fontSize: 13,
    color: "var(--accent-dark)",
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  },
  ghostButton: {
    border: "1px solid var(--line)",
    borderRadius: 999,
    background: "transparent",
    color: "var(--accent-dark)",
    padding: "8px 14px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap" as const,
  },
  inlineForm: {
    display: "grid",
    gap: 10,
    marginBottom: 16,
    padding: 16,
    background: "var(--card-strong)",
    borderRadius: 18,
    border: "1px solid var(--line)",
  },
  input: {
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
    padding: "10px 16px",
    width: "100%",
  },
};

function petitionStatusColor(status: PetitionSummary["status"]): CSSProperties {
  const map: Record<PetitionSummary["status"], string> = {
    OPEN: "var(--accent-dark)",
    AT_VOTE: "#1d4ed8",
    PASSED: "var(--accent)",
    FAILED: "var(--muted)",
    COOLDOWN: "#92400e",
  };
  return { color: map[status] };
}
