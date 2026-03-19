import { z } from "zod";

const NodeEnvSchema = z.enum(["development", "test", "production"]).default("development");
const NonEmptyStringSchema = z.string().trim().min(1);
const UrlStringSchema = z.string().trim().url();

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : undefined;
}

function parseRequired(name: string, schema: z.ZodType<string>) {
  const value = readEnv(name);
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new Error(`Missing or invalid environment variable: ${name}`);
  }

  return result.data;
}

function parseOptional(name: string, schema: z.ZodType<string>) {
  const value = readEnv(name);
  if (!value) return undefined;

  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid environment variable: ${name}`);
  }

  return result.data;
}

export const appEnv = {
  nodeEnv: NodeEnvSchema.parse(process.env.NODE_ENV),
};

export function getDatabaseUrl() {
  return parseRequired("DATABASE_URL", NonEmptyStringSchema);
}

export function getRedisUrl() {
  return parseRequired("REDIS_URL", UrlStringSchema);
}

export function getNextAuthSecret() {
  return parseRequired("NEXTAUTH_SECRET", z.string().trim().min(32));
}

export function getNextAuthUrl() {
  return parseOptional("NEXTAUTH_URL", UrlStringSchema);
}

export function getInternalApiKey() {
  return parseRequired("INTERNAL_API_KEY", z.string().trim().min(24));
}

export function getN8nWebhookUrl() {
  return parseOptional("N8N_WEBHOOK_PROPOSAL_URL", UrlStringSchema);
}
