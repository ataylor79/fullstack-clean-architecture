const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "ACCESS_TOKEN_SECRET",
  "RESEND_API_KEY",
] as const;

export function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
