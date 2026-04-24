"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { loadKeypair } from "@/lib/storage";
import { publicKeyToId } from "@onblast/crypto";

export function SiteNav() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const keypair = loadKeypair();
    if (keypair) setSessionId(publicKeyToId(keypair.publicKey));
  }, []);

  return (
    <nav style={styles.nav}>
      <Link href="/" style={styles.logo}>
        onBLAST
      </Link>
      <div style={styles.navLinks}>
        <Link href="/moderation-log" style={styles.navLink}>Mod log</Link>
        <Link href="/legal-demands" style={styles.navLink}>Legal</Link>
      </div>

      <div style={styles.right}>
        {sessionId ? (
          <>
            <span style={styles.sessionId}>{sessionId.slice(0, 14)}…</span>
            <Link href="/auth" style={styles.authLink}>
              Keypair
            </Link>
          </>
        ) : (
          <Link href="/auth" style={styles.authLink}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, CSSProperties> = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 52,
    background: "rgba(246,239,227,0.88)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(54,31,16,0.12)",
  },
  logo: {
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.03em",
    color: "var(--accent-dark)",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  navLink: {
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 13,
    color: "var(--muted)",
    fontWeight: 600,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  sessionId: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "var(--muted)",
  },
  authLink: {
    padding: "6px 14px",
    borderRadius: 999,
    background: "var(--accent-soft)",
    color: "var(--accent-dark)",
    fontWeight: 700,
    fontSize: 14,
  },
};
