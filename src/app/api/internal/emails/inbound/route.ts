import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";
import { logger } from "@/lib/logger";
import { EmailFolder, EmailDirection } from "@prisma/client";

export async function POST(request: NextRequest) {
  if (!authenticateApiKey(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    externalId?: string;
    fromName?: string;
    fromEmail: string;
    toAddresses?: string[];
    ccAddresses?: string[];
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    threadId?: string;
    receivedAt?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.fromEmail || !body.subject) {
    return NextResponse.json({ success: false, error: "fromEmail and subject required" }, { status: 400 });
  }

  // Dedup by externalId
  if (body.externalId) {
    const existing = await prisma.email.findUnique({ where: { externalId: body.externalId } });
    if (existing) {
      return NextResponse.json({ success: true, emailId: existing.id, duplicate: true });
    }
  }

  // Auto-detect client by sender email
  const client = await prisma.client.findFirst({
    where: { email: body.fromEmail },
    select: { id: true },
  });

  const email = await prisma.email.create({
    data: {
      externalId: body.externalId ?? null,
      direction: EmailDirection.INBOUND,
      folder: EmailFolder.INBOX,
      fromName: body.fromName ?? null,
      fromEmail: body.fromEmail,
      toAddresses: body.toAddresses ?? [],
      ccAddresses: body.ccAddresses ?? [],
      subject: body.subject,
      bodyText: body.bodyText ?? null,
      bodyHtml: body.bodyHtml ?? null,
      threadId: body.threadId ?? null,
      clientId: client?.id ?? null,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
    },
  });

  logger.info("Inbound email stored", { emailId: email.id, from: body.fromEmail, subject: body.subject });

  return NextResponse.json({ success: true, emailId: email.id });
}
