const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  verified: boolean;
  createdAt: string;
  _count: {
    posts: number;
  };
}

export interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    publicKey: string;
    reputationScore: number;
    createdAt: string;
  };
  business: {
    id: string;
    slug: string;
    name: string;
    verified: boolean;
  } | null;
  voteSummary: {
    score: number;
    upvoteCount: number;
    downvoteCount: number;
    totalWeight: number;
    viewerVote: 1 | -1 | null;
  };
}

export interface ModerationLogPage {
  entries: Array<{
    id: string;
    entryType: string;
    subjectKind: string | null;
    subjectId: string | null;
    action: string;
    details: Record<string, unknown>;
    createdAt: string;
  }>;
  nextCursor: string | null;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function authHeaders(accessToken?: string): HeadersInit {
  return accessToken
    ? {
        authorization: `Bearer ${accessToken}`,
      }
    : {};
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
        ...authHeaders(accessToken),
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
    await fetch(`${BASE}/auth/recovery/${encodeURIComponent(recoveryId)}`),
  );
}

export async function fetchBusinesses(): Promise<BusinessSummary[]> {
  return json(await fetch(`${BASE}/businesses`, { cache: "no-store" }));
}

export async function createBusiness(params: {
  accessToken: string;
  name: string;
  description?: string;
}): Promise<BusinessSummary> {
  return json(
    await fetch(`${BASE}/businesses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders(params.accessToken),
      },
      body: JSON.stringify({ name: params.name, description: params.description }),
    }),
  );
}

export async function fetchBusiness(slug: string): Promise<BusinessSummary> {
  return json(
    await fetch(`${BASE}/businesses/${encodeURIComponent(slug)}`, { cache: "no-store" }),
  );
}

export interface PostsPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

export async function fetchPosts(params?: {
  businessId?: string;
  authorId?: string;
  cursor?: string;
  accessToken?: string;
}): Promise<PostsPage> {
  const query = new URLSearchParams();
  if (params?.businessId) query.set("businessId", params.businessId);
  if (params?.authorId) query.set("authorId", params.authorId);
  if (params?.cursor) query.set("cursor", params.cursor);

  const queryString = query.size > 0 ? `?${query.toString()}` : "";
  return json(
    await fetch(`${BASE}/posts${queryString}`, {
      cache: "no-store",
      headers: authHeaders(params?.accessToken),
    }),
  );
}

export interface AccountProfile {
  id: string;
  publicKey: string;
  reputationScore: number;
  createdAt: string;
  _count: {
    posts: number;
    petitionsOpened: number;
    petitionsTargeted: number;
  };
}

export async function fetchAccount(id: string): Promise<AccountProfile> {
  return json(
    await fetch(`${BASE}/accounts/${encodeURIComponent(id)}`, { cache: "no-store" }),
  );
}

export async function createPost(params: {
  accessToken: string;
  content: string;
  businessId?: string;
}): Promise<{ id: string }> {
  return json(
    await fetch(`${BASE}/posts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders(params.accessToken),
      },
      body: JSON.stringify({
        content: params.content,
        businessId: params.businessId,
      }),
    }),
  );
}

export async function castVote(params: {
  accessToken: string;
  postId: string;
  direction: 1 | -1;
}): Promise<{ id: string }> {
  return json(
    await fetch(`${BASE}/votes`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders(params.accessToken),
      },
      body: JSON.stringify(params),
    }),
  );
}

export async function fetchModerationLog(cursor?: string): Promise<ModerationLogPage> {
  const url = cursor
    ? `${BASE}/moderation-log?cursor=${encodeURIComponent(cursor)}`
    : `${BASE}/moderation-log`;
  return json(await fetch(url, { cache: "no-store" }));
}

export interface LegalDemand {
  id: string;
  receivedAt: string;
  demandType:
    | "DMCA"
    | "DEFAMATION_CLAIM"
    | "CEASE_AND_DESIST"
    | "SUBPOENA"
    | "COURT_ORDER"
    | "LAW_ENFORCEMENT_REQUEST"
    | "OTHER";
  senderName: string;
  senderContact: string | null;
  targetKind: "post" | "account" | "business";
  targetRef: string;
  summary: string;
  status: "RECEIVED" | "CHALLENGED" | "COMPLIED" | "DENIED" | "WITHDRAWN";
  outcome: string | null;
  responseText: string | null;
  closedAt: string | null;
}

export async function fetchLegalDemands(): Promise<LegalDemand[]> {
  return json(await fetch(`${BASE}/legal-demands`, { cache: "no-store" }));
}

export async function createLegalDemand(params: {
  demandType: LegalDemand["demandType"];
  senderName: string;
  senderContact?: string;
  targetKind: LegalDemand["targetKind"];
  targetRef: string;
  summary: string;
  operatorKey?: string;
}): Promise<LegalDemand> {
  const { operatorKey, ...body } = params;
  const headers: HeadersInit = { "content-type": "application/json" };
  if (operatorKey) headers["x-operator-key"] = operatorKey;
  return json(
    await fetch(`${BASE}/legal-demands`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

export interface PetitionSummary {
  id: string;
  openerId: string;
  targetId: string;
  reason: string;
  status: "OPEN" | "AT_VOTE" | "PASSED" | "FAILED" | "COOLDOWN";
  openedAt: string;
  closedAt: string | null;
  outcome: string | null;
  _count: {
    cosigners: number;
    votes: number;
  };
}

export async function fetchPetitions(): Promise<PetitionSummary[]> {
  return json(await fetch(`${BASE}/petitions`, { cache: "no-store" }));
}

export async function fetchPost(id: string, accessToken?: string): Promise<FeedPost> {
  return json(
    await fetch(`${BASE}/posts/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: authHeaders(accessToken),
    }),
  );
}

export interface PetitionDetail extends PetitionSummary {
  cosigners: Array<{ accountId: string; createdAt: string }>;
  voteSummary: {
    banWeight: number;
    keepWeight: number;
    banPercent: number;
  };
}

export async function fetchPetition(id: string): Promise<PetitionDetail> {
  return json(await fetch(`${BASE}/petitions/${encodeURIComponent(id)}`, { cache: "no-store" }));
}

export async function cosignPetition(params: {
  accessToken: string;
  petitionId: string;
}): Promise<{ id: string }> {
  return json(
    await fetch(`${BASE}/petitions/${encodeURIComponent(params.petitionId)}/cosign`, {
      method: "POST",
      headers: authHeaders(params.accessToken),
    }),
  );
}

export async function votePetition(params: {
  accessToken: string;
  petitionId: string;
  ban: boolean;
}): Promise<{ id: string }> {
  return json(
    await fetch(`${BASE}/petitions/${encodeURIComponent(params.petitionId)}/vote`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders(params.accessToken),
      },
      body: JSON.stringify({ ban: params.ban }),
    }),
  );
}
