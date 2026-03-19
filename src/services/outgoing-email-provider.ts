import { getOutboundEmailWebhookBearer, getOutboundEmailWebhookUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { EmailAttachmentInput } from "@/lib/outgoing-email";

export interface SendEmailWithProviderInput {
  fromEmail: string;
  fromName?: string | null;
  to: string[];
  cc: string[];
  subject: string;
  bodyText: string;
  attachments: EmailAttachmentInput[];
}

export interface SendEmailWithProviderResult {
  provider: string;
  messageId?: string | null;
}

export async function sendEmailWithProvider(input: SendEmailWithProviderInput): Promise<SendEmailWithProviderResult> {
  const webhookUrl = getOutboundEmailWebhookUrl();
  if (!webhookUrl) {
    throw new Error("Uitgaande mailprovider is nog niet ingesteld.");
  }

  const bearer = getOutboundEmailWebhookBearer();
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify({
      from: {
        email: input.fromEmail,
        name: input.fromName ?? undefined,
      },
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      bodyText: input.bodyText,
      attachments: input.attachments,
    }),
  });

  if (!response.ok) {
    logger.warn("Outgoing email provider request failed", {
      status: response.status,
    });
    throw new Error(`Mailprovider fout: ${response.status}`);
  }

  const body = (await response.json().catch(() => null)) as
    | { messageId?: string | null; provider?: string | null }
    | null;

  return {
    provider: body?.provider ?? "webhook",
    messageId: body?.messageId ?? null,
  };
}
