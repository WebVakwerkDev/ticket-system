import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { getResolvedBusinessSettings } from "@/lib/settings";
import {
  parseEmailAddressList,
  readAndValidateAttachments,
} from "@/lib/outgoing-email";
import { OutgoingEmailFormSchema } from "@/lib/validations/outgoing-email";
import { sendEmailWithProvider } from "@/services/outgoing-email-provider";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Niet ingelogd." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("attachments")
      .filter((value): value is File => value instanceof File && value.size > 0);

    const parsed = OutgoingEmailFormSchema.parse({
      projectId: stringValue(formData.get("projectId")),
      replyToEmailId: stringValue(formData.get("replyToEmailId")),
      to: parseEmailAddressList(stringValue(formData.get("to")) ?? ""),
      cc: parseEmailAddressList(stringValue(formData.get("cc")) ?? ""),
      subject: stringValue(formData.get("subject")) ?? "",
      bodyText: stringValue(formData.get("bodyText")) ?? "",
    });

    if (parsed.projectId) {
      const project = await prisma.projectWorkspace.findUnique({
        where: { id: parsed.projectId },
        select: { id: true },
      });

      if (!project) {
        return NextResponse.json(
          { success: false, error: "Project niet gevonden." },
          { status: 404 },
        );
      }
    }

    const settings = await getResolvedBusinessSettings();
    if (!settings.email || !settings.companyName) {
      return NextResponse.json(
        {
          success: false,
          error: "Stel eerst bedrijfsnaam en afzender-e-mail in bij instellingen.",
        },
        { status: 400 },
      );
    }

    const attachments = await readAndValidateAttachments(files);

    const email = await prisma.outgoingEmail.create({
      data: {
        projectId: parsed.projectId ?? null,
        senderUserId: session.user.id,
        replyToEmailId: parsed.replyToEmailId ?? null,
        fromEmail: settings.email,
        fromName: settings.companyName,
        toAddresses: parsed.to,
        ccAddresses: parsed.cc,
        subject: parsed.subject,
        bodyText: parsed.bodyText,
        provider: "webhook",
        attachments: {
          create: attachments.map((attachment) => ({
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
          })),
        },
      },
      include: {
        attachments: true,
      },
    });

    try {
      const providerResult = await sendEmailWithProvider({
        fromEmail: email.fromEmail,
        fromName: email.fromName,
        to: email.toAddresses,
        cc: email.ccAddresses,
        subject: email.subject,
        bodyText: email.bodyText,
        attachments,
      });

      const updated = await prisma.outgoingEmail.update({
        where: { id: email.id },
        data: {
          status: "SENT",
          provider: providerResult.provider,
          providerMessageId: providerResult.messageId ?? null,
          sentAt: new Date(),
          providerError: null,
        },
        include: {
          attachments: true,
          sender: {
            select: { id: true, name: true, email: true },
          },
          replyTo: {
            select: { id: true, subject: true, toAddresses: true, ccAddresses: true },
          },
        },
      });

      await createAuditLog({
        actorUserId: session.user.id,
        entityType: "OutgoingEmail",
        entityId: email.id,
        action: "SEND",
        metadata: {
          projectId: parsed.projectId ?? null,
          to: parsed.to,
          subject: parsed.subject,
        },
      });

      return NextResponse.json({ success: true, email: updated }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "E-mail versturen mislukt.";

      const failed = await prisma.outgoingEmail.update({
        where: { id: email.id },
        data: {
          status: "FAILED",
          providerError: message,
        },
        include: {
          attachments: true,
          sender: {
            select: { id: true, name: true, email: true },
          },
          replyTo: {
            select: { id: true, subject: true, toAddresses: true, ccAddresses: true },
          },
        },
      });

      await createAuditLog({
        actorUserId: session.user.id,
        entityType: "OutgoingEmail",
        entityId: email.id,
        action: "FAILED",
        metadata: {
          projectId: parsed.projectId ?? null,
          subject: parsed.subject,
        },
      });

      return NextResponse.json(
        { success: false, error: message, email: failed },
        { status: 502 },
      );
    }
  } catch (error) {
    logger.error("Failed to send outgoing email", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "E-mail verzenden mislukt." },
      { status: 400 },
    );
  }
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : undefined;
}
