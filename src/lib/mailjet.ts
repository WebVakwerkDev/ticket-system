const MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";

export interface MailjetAttachment {
  ContentType: string;
  Filename: string;
  Base64Content: string;
}

export interface SendMailjetOptions {
  fromEmail: string;
  fromName: string;
  to: { email: string; name?: string }[];
  cc?: { email: string; name?: string }[];
  subject: string;
  textPart: string;
  attachments?: MailjetAttachment[];
}

export interface SendMailjetResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendViaMailjet(
  options: SendMailjetOptions,
  apiKey: string,
  apiSecret: string
): Promise<SendMailjetResult> {
  const message: Record<string, unknown> = {
    From: { Email: options.fromEmail, Name: options.fromName },
    To: options.to.map((t) => ({ Email: t.email, Name: t.name ?? "" })),
    Subject: options.subject,
    TextPart: options.textPart,
  };

  if (options.cc?.length) {
    message.Cc = options.cc.map((c) => ({ Email: c.email, Name: c.name ?? "" }));
  }
  if (options.attachments?.length) {
    message.Attachments = options.attachments;
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const res = await fetch(MAILJET_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({ Messages: [message] }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Mailjet ${res.status}: ${text.slice(0, 300)}` };
  }

  const json = (await res.json()) as {
    Messages?: [{ MessageID?: string | number; Status?: string }];
  };

  const messageId = json.Messages?.[0]?.MessageID
    ? String(json.Messages[0].MessageID)
    : undefined;

  return { success: true, messageId };
}
