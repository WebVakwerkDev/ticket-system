"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { getN8nWebhookUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getResolvedBusinessSettings } from "@/lib/settings";
import { ProposalDraftStatus } from "@prisma/client";
import {
  clientContactSelect,
  projectProposalSelect,
} from "@/lib/prisma-selects";

export async function getProposalDrafts(projectId: string) {
  try {
    const proposals = await prisma.proposalDraft.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: clientContactSelect,
        },
      },
    });

    return { success: true, proposals };
  } catch (error) {
    logger.error("Failed to fetch proposal drafts", error, { projectId });
    return { success: false, error: "Offerteconcepten ophalen mislukt." };
  }
}

export async function sendProposalToN8n(proposalId: string, actorUserId: string) {
  const webhookUrl = getN8nWebhookUrl();
  if (!webhookUrl) {
    return { success: false, error: "N8N_WEBHOOK_PROPOSAL_URL is niet ingesteld." };
  }

  const [proposal, settings] = await Promise.all([
    prisma.proposalDraft.findUnique({
      where: { id: proposalId },
      include: {
        client: {
          select: clientContactSelect,
        },
        project: {
          select: projectProposalSelect,
        },
      },
    }),
    getResolvedBusinessSettings(),
  ]);

  if (!proposal) {
    return { success: false, error: "Offerte niet gevonden." };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposalId: proposal.id,
        title: proposal.title,
        recipientName: proposal.recipientName,
        recipientEmail: proposal.recipientEmail,
        recipientCompany: proposal.recipientCompany,
        recipientAddress: proposal.recipientAddress,
        summary: proposal.summary,
        scope: proposal.scope,
        priceLabel: proposal.priceLabel,
        amount: proposal.amount ? Number(proposal.amount) : null,
        deliveryTime: proposal.deliveryTime,
        notes: proposal.notes,
        client: proposal.client,
        project: proposal.project,
        createdAt: proposal.createdAt,
        from: {
          companyName: settings.companyName,
          email: settings.email,
          address: settings.address,
          kvkNumber: settings.kvkNumber,
          vatNumber: settings.vatNumber,
          iban: settings.iban,
          bankName: settings.bankName,
          phone: settings.phone,
          websiteUrl: settings.websiteUrl,
        },
        defaults: {
          quoteValidDays: settings.defaultQuoteValidDays,
          quoteFooterText: settings.quoteFooterText,
          termsText: settings.defaultTermsText,
        },
      }),
    });

    if (!res.ok) {
      return { success: false, error: `n8n webhook fout: ${res.status}` };
    }

    await prisma.proposalDraft.update({
      where: { id: proposalId },
      data: {
        sentToN8nCount: { increment: 1 },
        lastSentToN8nAt: new Date(),
        status: ProposalDraftStatus.SENT_TO_N8N,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "ProposalDraft",
      entityId: proposalId,
      action: "UPDATE",
      metadata: { action: "SENT_TO_N8N", sentCount: proposal.sentToN8nCount + 1 },
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send proposal to n8n", error, { proposalId });
    return { success: false, error: "n8n webhook niet bereikbaar." };
  }
}

export async function deleteProposalDraft(id: string, actorUserId: string) {
  try {
    const proposal = await prisma.proposalDraft.findUnique({ where: { id } });
    if (!proposal) {
      return { success: false, error: "Offerte niet gevonden." };
    }

    await prisma.proposalDraft.delete({ where: { id } });

    await createAuditLog({
      actorUserId,
      entityType: "ProposalDraft",
      entityId: id,
      action: "DELETE",
      metadata: { title: proposal.title, projectId: proposal.projectId },
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete proposal draft", error, { id });
    return { success: false, error: "Offerte verwijderen mislukt." };
  }
}

export async function createProposalDraft(data: {
  actorUserId: string;
  clientId: string;
  projectId?: string;
  title: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  recipientAddress?: string;
  summary: string;
  scope?: string;
  priceLabel?: string;
  amount?: number;
  deliveryTime?: string;
  notes?: string;
}) {
  try {
    const proposal = await prisma.proposalDraft.create({
      data: {
        clientId: data.clientId,
        projectId: data.projectId ?? null,
        title: data.title,
        recipientName: data.recipientName ?? null,
        recipientEmail: data.recipientEmail ?? null,
        recipientCompany: data.recipientCompany ?? null,
        recipientAddress: data.recipientAddress ?? null,
        summary: data.summary,
        scope: data.scope ?? null,
        priceLabel: data.priceLabel ?? null,
        amount: data.amount ?? null,
        deliveryTime: data.deliveryTime ?? null,
        notes: data.notes ?? null,
      },
    });

    await createAuditLog({
      actorUserId: data.actorUserId,
      entityType: "ProposalDraft",
      entityId: proposal.id,
      action: "CREATE",
      metadata: {
        clientId: data.clientId,
        projectId: data.projectId,
        title: data.title,
      },
    });

    return {
      success: true,
      proposal: {
        id: proposal.id,
        title: proposal.title,
      },
    };
  } catch (error) {
    logger.error("Failed to create proposal draft", error, {
      clientId: data.clientId,
      projectId: data.projectId,
      title: data.title,
    });
    return { success: false, error: "Offerteconcept aanmaken mislukt." };
  }
}
