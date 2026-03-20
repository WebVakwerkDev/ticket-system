import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";
import { logger } from "@/lib/logger";
import { ProposalDraftStatus } from "@prisma/client";

// GET /api/internal/proposals/[id] — ophalen offertedata voor n8n
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authenticateApiKey(request)) {
    logger.warn("Rejected internal proposals API request");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const proposal = await prisma.proposalDraft.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          address: true,
        },
      },
      project: {
        select: { id: true, name: true, description: true },
      },
    },
  });

  if (!proposal) {
    return NextResponse.json({ success: false, error: "Offerte niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ success: true, proposal });
}

// PATCH /api/internal/proposals/[id] — n8n meldt terug: PDF klaar, Google Drive URL
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authenticateApiKey(request)) {
    logger.warn("Rejected internal proposals API request");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { driveUrl?: string; driveFileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.proposalDraft.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Offerte niet gevonden" }, { status: 404 });
  }

  const updated = await prisma.proposalDraft.update({
    where: { id },
    data: {
      status: ProposalDraftStatus.SENT_TO_N8N,
      payloadJson: {
        driveUrl: body.driveUrl ?? null,
        driveFileId: body.driveFileId ?? null,
        processedAt: new Date().toISOString(),
      },
    },
  });

  logger.info("Proposal updated by n8n callback", { proposalId: id, driveUrl: body.driveUrl });

  return NextResponse.json({ success: true, proposal: updated });
}
