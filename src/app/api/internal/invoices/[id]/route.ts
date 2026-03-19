import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { getInternalApiKey } from "@/lib/env";
import { logger } from "@/lib/logger";

function authenticateApiKey(request: NextRequest): boolean {
  const key = getInternalApiKey();
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice(7));
  const expected = Buffer.from(key);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

// PATCH /api/internal/invoices/[id] — n8n callback: PDF klaar, Google Drive URL opslaan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authenticateApiKey(request)) {
    logger.warn("Rejected internal invoices API request");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { driveUrl?: string; driveFileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ success: false, error: "Factuur niet gevonden" }, { status: 404 });
  }

  logger.info("Invoice PDF callback from n8n", { invoiceId: id, driveUrl: body.driveUrl });

  return NextResponse.json({ success: true, invoiceId: id });
}
