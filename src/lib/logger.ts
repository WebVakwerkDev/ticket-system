import { appEnv } from "@/lib/env";

const REDACTED_KEYS = [
  "authorization",
  "cookie",
  "password",
  "passwordHash",
  "secret",
  "token",
  "apiKey",
  "key",
] as const;

type LogLevel = "info" | "warn" | "error";

function shouldRedact(key: string) {
  const normalizedKey = key.toLowerCase();
  return REDACTED_KEYS.some((candidate) => normalizedKey.includes(candidate.toLowerCase()));
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[truncated]";

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, depth + 1));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      shouldRedact(key) ? "[redacted]" : sanitizeValue(entryValue, depth + 1),
    ]),
  );
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(appEnv.nodeEnv !== "production" && error.stack ? { stack: error.stack } : {}),
    };
  }

  return { message: String(error) };
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? sanitizeValue(meta) : undefined;

  if (payload) {
    console[level](message, payload);
    return;
  }

  console[level](message);
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    write("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    write("warn", message, meta);
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    write("error", message, {
      ...(meta ?? {}),
      ...(error !== undefined ? { error: serializeError(error) } : {}),
    });
  },
};
