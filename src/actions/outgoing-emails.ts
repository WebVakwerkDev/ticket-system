"use server";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function getOutgoingEmails(projectId: string) {
  try {
    const emails = await prisma.outgoingEmail.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        replyTo: {
          select: {
            id: true,
            subject: true,
            toAddresses: true,
            ccAddresses: true,
          },
        },
      },
    });

    return { success: true as const, emails };
  } catch (error) {
    logger.error("Failed to fetch outgoing emails", error, { projectId });
    return { success: false as const, error: "Verzonden e-mails ophalen mislukt." };
  }
}
