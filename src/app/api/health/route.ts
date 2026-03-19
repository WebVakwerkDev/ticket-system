import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    logger.warn("Health check failed");
    return NextResponse.json(
      { status: "error" },
      { status: 503 }
    );
  }
}
