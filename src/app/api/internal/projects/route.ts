import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { ZodError } from "zod";
import { ProjectCreateApiSchema } from "@/lib/validations/api";
import {
  createProjectViaApi,
  ApiError,
} from "@/services/projectCreationService";
import { getInternalApiKey } from "@/lib/env";
import { logger } from "@/lib/logger";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function authenticateApiKey(request: NextRequest): boolean {
  const key = getInternalApiKey();

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(header.slice(7));
  const expected = Buffer.from(key);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

// ─── POST /api/internal/projects ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Authenticate
  if (!authenticateApiKey(request)) {
    logger.warn("Rejected internal API request", {
      requestIp: request.headers.get("x-forwarded-for") ?? "unknown",
    });
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // 3. Validate
  let input;
  try {
    input = ProjectCreateApiSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 422 },
    );
  }

  // 4. Build source metadata for audit logs
  const sourceMetadata: Record<string, unknown> = {
    source: "internal_api",
    sourceType: input.source?.type ?? "unknown",
    sourceLabel: input.source?.label ?? null,
    requestIp: request.headers.get("x-forwarded-for") ?? null,
  };

  // 5. Execute
  try {
    const result = await createProjectViaApi(input, sourceMetadata);

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }

    logger.error("Unexpected internal API error", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
