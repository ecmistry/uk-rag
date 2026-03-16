export const ENV = {
  appId: process.env.VITE_APP_ID ?? process.env.APP_ID ?? "dev-app",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? process.env.MONGODB_URI ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

if (ENV.isProduction) {
  const required: [string, string][] = [
    ["databaseUrl", "DATABASE_URL or MONGODB_URI"],
    ["cookieSecret", "JWT_SECRET"],
  ];
  for (const [key, envName] of required) {
    if (!ENV[key as keyof typeof ENV]) {
      console.error(`[ENV] Missing required env var: ${envName}`);
      process.exit(1);
    }
  }
}
