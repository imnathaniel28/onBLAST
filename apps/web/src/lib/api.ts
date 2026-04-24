const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function requestChallenge(publicKey: string): Promise<{
  nonce: string;
  expiresAt: string;
}> {
  return json(
    await fetch(`${BASE}/auth/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKey }),
    }),
  );
}

export async function verifySignature(params: {
  publicKey: string;
  nonce: string;
  signature: string;
}): Promise<{
  accessToken: string;
  account: { id: string; publicKey: string; created: boolean };
}> {
  return json(
    await fetch(`${BASE}/auth/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    }),
  );
}

export async function uploadRecoveryBackup(params: {
  accessToken: string;
  recoveryId: string;
  ciphertext: string;
  kdfSalt: string;
  kdfParams: unknown;
}): Promise<{ ok: true }> {
  const { accessToken, ...body } = params;
  return json(
    await fetch(`${BASE}/auth/recovery/backup`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }),
  );
}

export async function fetchRecoveryBackup(recoveryId: string): Promise<{
  ciphertext: string;
  kdfSalt: string;
  kdfParams: { N: number; r: number; p: number; dkLen: 32 };
}> {
  return json(
    await fetch(
      `${BASE}/auth/recovery/${encodeURIComponent(recoveryId)}`,
    ),
  );
}
