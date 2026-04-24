import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing required env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  host: process.env.API_HOST ?? "127.0.0.1",
  jwtSecret: required("JWT_SECRET"),
  jwtAccessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  challengeTtlSeconds: Number(process.env.CHALLENGE_TTL_SECONDS ?? 60),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  // If set, POST /legal-demands requires x-operator-key: <value>.
  // Leave unset in dev to skip the check.
  operatorKey: process.env.OPERATOR_KEY ?? null,
};
