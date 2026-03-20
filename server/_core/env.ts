import { randomBytes } from "crypto";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    console.error("[ENV] Missing or weak JWT_SECRET (min 16 chars) — aborting in production");
    process.exit(1);
  }
  const generated = randomBytes(32).toString("hex");
  console.warn("[ENV] JWT_SECRET not set — generated random ephemeral secret (sessions will not survive restarts)");
  return generated;
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? process.env.APP_ID ?? "dev-app",
  cookieSecret: resolveJwtSecret(),
  databaseUrl: process.env.DATABASE_URL ?? process.env.MONGODB_URI ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

if (ENV.isProduction) {
  if (!ENV.databaseUrl) {
    console.error("[ENV] Missing required env var: DATABASE_URL or MONGODB_URI");
    process.exit(1);
  }
}
