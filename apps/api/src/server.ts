import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { authRoutes } from "./auth/routes.js";
import { postsRoutes } from "./modules/posts/routes.js";
import { businessesRoutes } from "./modules/businesses/routes.js";
import { votesRoutes } from "./modules/votes/routes.js";
import { petitionsRoutes } from "./modules/petitions/routes.js";
import { moderationLogRoutes } from "./modules/moderation-log/routes.js";
import { legalDemandsRoutes } from "./modules/legal-demands/routes.js";
import { csamRoutes } from "./modules/csam-report/routes.js";
import { accountsRoutes } from "./modules/accounts/routes.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    // CRITICAL: log serializers must NOT include ip, ips, hostname,
    // remoteAddress, headers, or body. This is part of the
    // "nothing to subpoena" posture. See app-idea.md > Anonymity Protection.
    logger: {
      level: "info",
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          // Intentionally omitted: ip, ips, hostname, remoteAddress, headers
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    },
    // Do not trust proxy headers. We never want req.ip to reflect the client's
    // real address and we never want X-Forwarded-For in any log.
    trustProxy: false,
    bodyLimit: 1 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: config.webOrigin,
    credentials: false,
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(postsRoutes, { prefix: "/posts" });
  await app.register(businessesRoutes, { prefix: "/businesses" });
  await app.register(votesRoutes, { prefix: "/votes" });
  await app.register(petitionsRoutes, { prefix: "/petitions" });
  await app.register(moderationLogRoutes, { prefix: "/moderation-log" });
  await app.register(legalDemandsRoutes, { prefix: "/legal-demands" });
  await app.register(csamRoutes, { prefix: "/csam" });
  await app.register(accountsRoutes, { prefix: "/accounts" });

  app.get("/health", async () => ({ ok: true }));

  return app;
}
