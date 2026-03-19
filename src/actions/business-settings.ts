"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { BusinessSettingsSchema, type BusinessSettingsData } from "@/lib/validations/business-settings";
import { logger } from "@/lib/logger";

const SINGLETON_ID = "singleton";

export async function getBusinessSettings() {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { id: SINGLETON_ID },
    });
    return { success: true as const, settings };
  } catch (error) {
    logger.error("getBusinessSettings error:", error);
    return { success: false as const, error: "Instellingen ophalen mislukt" };
  }
}

export async function updateBusinessSettings(data: BusinessSettingsData, actorUserId: string) {
  try {
    const validated = BusinessSettingsSchema.parse(data);

    const settings = await prisma.businessSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...validated },
      update: validated,
    });

    await createAuditLog({
      actorUserId,
      entityType: "BusinessSettings",
      entityId: SINGLETON_ID,
      action: "UPDATE",
      metadata: {
        companyName: validated.companyName,
        paymentTermDays: validated.paymentTermDays,
        defaultVatRate: validated.defaultVatRate,
      },
    });

    return { success: true as const, settings };
  } catch (error) {
    logger.error("updateBusinessSettings error:", error);
    return { success: false as const, error: "Instellingen opslaan mislukt" };
  }
}
