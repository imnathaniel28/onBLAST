"use client";

import { useEffect, useState } from "react";
import {
  generateKeypair,
  keypairFromSeed,
  publicKeyToId,
  signChallenge,
  createRecoveryBackup,
  restoreSeedFromBackup,
  generateRecoveryId,
} from "@onblast/crypto";
import {
  requestChallenge,
  verifySignature,
  uploadRecoveryBackup,
  fetchRecoveryBackup,
} from "@/lib/api";
import {
  loadKeypair,
  saveKeypair,
  saveAccessToken,
  loadAccessToken,
  clearKeypair,
} from "@/lib/storage";

type Status =
  | { kind: "idle" }
  | { kind: "busy"; message: string }
  | { kind: "error"; message: string }
  | { kind: "signed-in"; publicKey: string };

export default function AuthPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [recoveryId, setRecoveryId] = useState<string>("");
  const [passphrase, setPassphrase] = useState<string>("");
  const [restoreRecoveryId, setRestoreRecoveryId] = useState<string>("");
  const [restorePassphrase, setRestorePassphrase] = useState<string>("");

  useEffect(() => {
    const existing = loadKeypair();
    const token = loadAccessToken();
    if (existing && token) {
      setStatus({ kind: "signed-in", publicKey: publicKeyToId(existing.publicKey) });
    }
  }, []);

  async function signInExisting() {
    const kp = loadKeypair();
    if (!kp) {
      setStatus({ kind: "error", message: "no local keypair; create one first" });
      return;
    }
    await authenticate(kp);
  }

  async function createAndSignIn() {
    const kp = generateKeypair();
    saveKeypair(kp);
    await authenticate(kp);
  }

  async function authenticate(kp: { seed: Uint8Array; publicKey: Uint8Array }) {
    try {
      setStatus({ kind: "busy", message: "authenticating…" });
      const publicKey = publicKeyToId(kp.publicKey);
      const { nonce } = await requestChallenge(publicKey);
      const signature = signChallenge(kp.seed, nonce);
      const result = await verifySignature({ publicKey, nonce, signature });
      saveAccessToken(result.accessToken);
      setStatus({ kind: "signed-in", publicKey });
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  }

  async function backupRecovery() {
    const kp = loadKeypair();
    const token = loadAccessToken();
    if (!kp || !token) {
      setStatus({ kind: "error", message: "sign in first" });
      return;
    }
    if (passphrase.length < 8) {
      setStatus({ kind: "error", message: "passphrase must be at least 8 chars" });
      return;
    }
    try {
      setStatus({ kind: "busy", message: "encrypting and uploading backup…" });
      const rid = generateRecoveryId();
      const backup = createRecoveryBackup(kp.seed, passphrase, rid);
      await uploadRecoveryBackup({
        accessToken: token,
        recoveryId: backup.recoveryId,
        ciphertext: backup.ciphertext,
        kdfSalt: backup.kdfSalt,
        kdfParams: backup.kdfParams,
      });
      setRecoveryId(rid);
      setPassphrase("");
      setStatus({
        kind: "signed-in",
        publicKey: publicKeyToId(kp.publicKey),
      });
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  }

  async function restoreFromBackup() {
    try {
      setStatus({ kind: "busy", message: "fetching and decrypting backup…" });
      const blob = await fetchRecoveryBackup(restoreRecoveryId.trim());
      const seed = restoreSeedFromBackup(blob, restorePassphrase);
      const kp = keypairFromSeed(seed);
      saveKeypair(kp);
      await authenticate(kp);
      setRestorePassphrase("");
      setRestoreRecoveryId("");
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  }

  function signOut() {
    clearKeypair();
    setStatus({ kind: "idle" });
    setRecoveryId("");
  }

  return (
    <main>
      <h1>Sign in</h1>
      <p style={{ color: "#555" }}>
        Accounts are Ed25519 keypairs. No email, no phone, no password. Your
        private key stays in this browser. Losing it without a recovery backup
        means losing this account permanently.
      </p>

      <section>
        <h2>Status</h2>
        <pre style={{ background: "#f4f4f4", padding: "1rem" }}>
          {JSON.stringify(status, null, 2)}
        </pre>
      </section>

      {status.kind !== "signed-in" ? (
        <section>
          <h2>Get in</h2>
          <button onClick={createAndSignIn}>Create new account</button>{" "}
          <button onClick={signInExisting}>Sign in with local key</button>

          <h3 style={{ marginTop: "2rem" }}>Restore from recovery backup</h3>
          <p style={{ color: "#555" }}>
            If you saved a recovery id and passphrase on another device, enter
            them here.
          </p>
          <input
            placeholder="recovery id"
            value={restoreRecoveryId}
            onChange={(e) => setRestoreRecoveryId(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <input
            type="password"
            placeholder="passphrase"
            value={restorePassphrase}
            onChange={(e) => setRestorePassphrase(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={restoreFromBackup}>Restore</button>
        </section>
      ) : (
        <section>
          <h2>Signed in</h2>
          <p>
            <code>{status.publicKey}</code>
          </p>
          <button onClick={signOut}>Sign out (clear local key)</button>

          <h3 style={{ marginTop: "2rem" }}>Optional: passphrase recovery</h3>
          <p style={{ color: "#555" }}>
            Protects against losing your local key. The passphrase never leaves
            this browser; the server stores only a ciphertext. Write down the
            recovery id we give you — without it, the backup can't be found.
          </p>
          <input
            type="password"
            placeholder="passphrase (min 8 chars)"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={backupRecovery}>Create recovery backup</button>

          {recoveryId && (
            <div style={{ marginTop: "1rem", background: "#fffbdd", padding: "1rem" }}>
              <strong>Save this recovery id now. You will NOT see it again.</strong>
              <pre>{recoveryId}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
