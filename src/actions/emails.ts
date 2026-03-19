"use server";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createAuditLog } from "@/lib/audit";
import { sendViaMailjet } from "@/lib/mailjet";
import {
  getMailjetApiKey,
  getMailjetApiSecret,
  getMailjetSenderEmail,
  getMailjetSenderName,
} from "@/lib/env";
import { SendEmailSchema, type SendEmailInput } from "@/lib/validations/email";
import { EmailStatus } from "@prisma/client";

export async function sendEmail(input: SendEmailInput, actorUserId: string) {
  const parsed = SendEmailSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Ongeldige invoer";
    return { success: false as const, error: message };
  }

  const data = parsed.data;

  const apiKey = getMailjetApiKey();
  const apiSecret = getMailjetApiSecret();
  const senderEmail = getMailjetSenderEmail();
  const senderName = getMailjetSenderName() ?? senderEmail ?? "Verzender";

  if (!apiKey || !apiSecret || !senderEmail) {
    return {
      success: false as const,
      error: "E-mail is niet geconfigureerd. Stel MAILJET_API_KEY, MAILJET_API_SECRET en MAILJET_SENDER_EMAIL in.",
    };
  }

  const attachmentsMeta = data.attachments.map(({ name, mimeType, size }) => ({
    name,
    mimeType,
    size,
  }));

  const result = await sendViaMailjet(
    {
      fromEmail: senderEmail,
      fromName: senderName,
      to: data.toAddresses.map((email) => ({ email })),
      cc: data.ccAddresses.length > 0 ? data.ccAddresses.map((email) => ({ email })) : undefined,
      subject: data.subject,
      textPart: data.bodyText,
      attachments: data.attachments.map((att) => ({
        ContentType: att.mimeType,
        Filename: att.name,
        Base64Content: att.data,
      })),
    },
    apiKey,
    apiSecret
  );

  if (!result.success) {
    logger.error("Mailjet send failed", { error: result.error });

    try {
      await prisma.email.create({
        data: {
          changeRequestId: data.changeRequestId ?? null,
          fromEmail: senderEmail,
          fromName: senderName,
          toAddresses: data.toAddresses,
          ccAddresses: data.ccAddresses,
          subject: data.subject,
          bodyText: data.bodyText,
          status: EmailStatus.FAILED,
          errorMessage: result.error,
          attachmentsMeta: attachmentsMeta.length > 0 ? attachmentsMeta : undefined,
        },
      });
    } catch (dbErr) {
      logger.error("Failed to persist failed email record", dbErr);
    }

    return { success: false as const, error: result.error ?? "Verzenden mislukt." };
  }

  const email = await prisma.email.create({
    data: {
      changeRequestId: data.changeRequestId ?? null,
      fromEmail: senderEmail,
      fromName: senderName,
      toAddresses: data.toAddresses,
      ccAddresses: data.ccAddresses,
      subject: data.subject,
      bodyText: data.bodyText,
      status: EmailStatus.SENT,
      providerMessageId: result.messageId ?? null,
      attachmentsMeta: attachmentsMeta.length > 0 ? attachmentsMeta : undefined,
      sentAt: new Date(),
    },
  });

  await createAuditLog({
    actorUserId,
    entityType: "Email",
    entityId: email.id,
    action: "SEND",
    metadata: { to: data.toAddresses, subject: data.subject },
  });

  logger.info("Email sent", { emailId: email.id, to: data.toAddresses, subject: data.subject });

  return { success: true as const, emailId: email.id };
}

export async function getEmails(options?: { changeRequestId?: string }) {
  try {
    const emails = await prisma.email.findMany({
      where: options?.changeRequestId
        ? { changeRequestId: options.changeRequestId }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        changeRequest: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true, slug: true } },
          },
        },
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

export async function getTicketsForCompose() {
  try {
    const changeRequests = await prisma.changeRequest.findMany({
      where: { status: { notIn: ["DONE"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        project: { select: { name: true, client: { select: { companyName: true, email: true } } } },
      },
      take: 100,
    });
    return { success: true as const, changeRequests };
  } catch (error) {
    logger.error("getTicketsForCompose error:", error);
    return { success: false as const, error: "Tickets ophalen mislukt." };
  }
}
