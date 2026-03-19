"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { EmailFolder, EmailDirection } from "@prisma/client";
import { getN8nEmailSendWebhookUrl } from "@/lib/env";

export async function getEmails(folder: EmailFolder = EmailFolder.INBOX) {
  try {
    const emails = await prisma.email.findMany({
      where: { folder },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, companyName: true } },
        changeRequest: { select: { id: true, title: true } },
      },
    });
    return { success: true as const, emails };
  } catch (error) {
    logger.error("getEmails error:", error);
    return { success: false as const, error: "E-mails ophalen mislukt." };
  }
}

export async function getEmail(id: string) {
  try {
    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        changeRequest: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!email) return { success: false as const, error: "E-mail niet gevonden." };
    return { success: true as const, email };
  } catch (error) {
    logger.error("getEmail error:", error);
    return { success: false as const, error: "E-mail ophalen mislukt." };
  }
}

export async function markEmailRead(id: string, isRead: boolean) {
  try {
    await prisma.email.update({ where: { id }, data: { isRead } });
    return { success: true as const };
  } catch (error) {
    logger.error("markEmailRead error:", error);
    return { success: false as const, error: "Status aanpassen mislukt." };
  }
}

export async function trashEmail(id: string, actorUserId: string) {
  try {
    await prisma.email.update({ where: { id }, data: { folder: EmailFolder.TRASH } });
    await createAuditLog({ actorUserId, entityType: "Email", entityId: id, action: "TRASH" });
    return { success: true as const };
  } catch (error) {
    logger.error("trashEmail error:", error);
    return { success: false as const, error: "Verplaatsen naar prullenbak mislukt." };
  }
}

export async function restoreEmail(id: string, actorUserId: string) {
  try {
    const email = await prisma.email.findUnique({ where: { id } });
    if (!email) return { success: false as const, error: "E-mail niet gevonden." };
    const folder = email.direction === EmailDirection.OUTBOUND ? EmailFolder.SENT : EmailFolder.INBOX;
    await prisma.email.update({ where: { id }, data: { folder } });
    await createAuditLog({ actorUserId, entityType: "Email", entityId: id, action: "RESTORE" });
    return { success: true as const };
  } catch (error) {
    logger.error("restoreEmail error:", error);
    return { success: false as const, error: "Herstellen mislukt." };
  }
}

export async function linkEmailToTicket(emailId: string, changeRequestId: string, actorUserId: string) {
  try {
    await prisma.email.update({ where: { id: emailId }, data: { changeRequestId } });
    await createAuditLog({
      actorUserId,
      entityType: "Email",
      entityId: emailId,
      action: "LINK_TICKET",
      metadata: { changeRequestId },
    });
    return { success: true as const };
  } catch (error) {
    logger.error("linkEmailToTicket error:", error);
    return { success: false as const, error: "Koppelen mislukt." };
  }
}

export async function unlinkEmailFromTicket(emailId: string, actorUserId: string) {
  try {
    await prisma.email.update({ where: { id: emailId }, data: { changeRequestId: null } });
    await createAuditLog({ actorUserId, entityType: "Email", entityId: emailId, action: "UNLINK_TICKET" });
    return { success: true as const };
  } catch (error) {
    logger.error("unlinkEmailFromTicket error:", error);
    return { success: false as const, error: "Ontkoppelen mislukt." };
  }
}

export async function sendEmail(
  data: {
    toAddresses: string[];
    ccAddresses?: string[];
    subject: string;
    bodyText: string;
    changeRequestId?: string;
    clientId?: string;
    replyToExternalId?: string;
  },
  actorUserId: string
) {
  const webhookUrl = getN8nEmailSendWebhookUrl();
  if (!webhookUrl) {
    return { success: false as const, error: "N8N_WEBHOOK_EMAIL_SEND_URL is niet ingesteld." };
  }

  try {
    // Create outbound email record first
    const email = await prisma.email.create({
      data: {
        direction: EmailDirection.OUTBOUND,
        folder: EmailFolder.SENT,
        fromEmail: "", // filled in by n8n from Gmail sender
        toAddresses: data.toAddresses,
        ccAddresses: data.ccAddresses ?? [],
        subject: data.subject,
        bodyText: data.bodyText,
        isRead: true,
        changeRequestId: data.changeRequestId ?? null,
        clientId: data.clientId ?? null,
        sentAt: new Date(),
      },
    });

    // Call n8n to actually send
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailId: email.id,
        to: data.toAddresses,
        cc: data.ccAddresses ?? [],
        subject: data.subject,
        bodyText: data.bodyText,
        replyToExternalId: data.replyToExternalId ?? null,
      }),
    });

    if (!res.ok) {
      logger.error("n8n email send webhook failed", { status: res.status, emailId: email.id });
    }

    await createAuditLog({
      actorUserId,
      entityType: "Email",
      entityId: email.id,
      action: "SEND",
      metadata: { to: data.toAddresses, subject: data.subject },
    });

    return { success: true as const, emailId: email.id };
  } catch (error) {
    logger.error("sendEmail error:", error);
    return { success: false as const, error: "E-mail versturen mislukt." };
  }
}

export async function getTicketsForLinking() {
  try {
    const changeRequests = await prisma.changeRequest.findMany({
      where: { status: { notIn: ["DONE"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        project: { select: { name: true, client: { select: { companyName: true } } } },
      },
      take: 100,
    });
    return { success: true as const, changeRequests };
  } catch (error) {
    logger.error("getTicketsForLinking error:", error);
    return { success: false as const, error: "Tickets ophalen mislukt." };
  }
}
