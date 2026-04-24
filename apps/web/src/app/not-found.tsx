import Link from "next/link";
import type { CSSProperties } from "react";

export default function NotFound() {
  return (
    <main style={styles.page}>
      <p style={styles.code}>404</p>
      <h1 style={styles.title}>Not found</h1>
      <p style={styles.body}>
        This page doesn&apos;t exist, or the post, petition, or business you were looking for has
        been removed following a valid court order — which would appear in the{" "}
        <Link href="/moderation-log" style={styles.link}>moderation log</Link>.
      </p>
      <Link href="/" style={styles.home}>
        ← Back to feed
      </Link>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 600,
    margin: "80px auto",
    padding: "0 24px",
    textAlign: "center",
  },
  code: {
    fontSize: 72,
    fontWeight: 800,
    margin: "0 0 8px",
    color: "var(--accent)",
    lineHeight: 1,
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    margin: "0 0 16px",
  },
  body: {
    fontSize: 18,
    lineHeight: 1.6,
    color: "var(--muted)",
    margin: "0 0 32px",
  },
  link: {
    color: "var(--accent-dark)",
    fontWeight: 700,
  },
  home: {
    display: "inline-flex",
    padding: "12px 22px",
    borderRadius: 999,
    background: "var(--accent-soft)",
    color: "var(--accent-dark)",
    fontWeight: 700,
  },
};
