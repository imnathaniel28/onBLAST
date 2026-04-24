import { SignJWT, jwtVerify } from "jose";
import { config } from "../config.js";

const secret = new TextEncoder().encode(config.jwtSecret);

export interface AccessClaims {
  sub: string; // Account.id
  pk: string;  // public key (base64url). Kept in the token for client UX, not auth.
}

export async function issueAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ pk: claims.pk })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${config.jwtAccessTtlSeconds}s`)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret);
  if (typeof payload.sub !== "string" || typeof payload.pk !== "string") {
    throw new Error("malformed access token");
  }
  return { sub: payload.sub, pk: payload.pk };
}
