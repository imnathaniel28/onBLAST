"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={styles.page}>
      <p style={styles.code}>Error</p>
      <h1 style={styles.title}>Something went wrong</h1>
      <p style={styles.body}>
        {error.message || "An unexpected error occurred. The API may be down or unreachable."}
      </p>
      <div style={styles.actions}>
        <button onClick={reset} style={styles.retryButton}>
          Try again
        </button>
        <Link href="/" style={styles.home}>
          ← Back to feed
        </Link>
      </div>
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
    fontSize: 48,
    fontWeight: 800,
    margin: "0 0 8px",
    color: "var(--accent)",
    lineHeight: 1,
  },
  title: {
    fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
    margin: "0 0 16px",
  },
  body: {
    fontSize: 17,
    lineHeight: 1.6,
    color: "var(--muted)",
    margin: "0 0 32px",
    fontFamily: "monospace",
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  retryButton: {
    border: 0,
    borderRadius: 999,
    background: "var(--accent)",
    color: "white",
    padding: "12px 22px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  },
  home: {
    display: "inline-flex",
    alignItems: "center",
    padding: "12px 22px",
    borderRadius: 999,
    background: "var(--accent-soft)",
    color: "var(--accent-dark)",
    fontWeight: 700,
  },
};
