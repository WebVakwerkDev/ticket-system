"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

const BCRYPT_ROUNDS = 12;

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, users };
  } catch (error) {
    logger.error("getUsers error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function createUser(
  data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  },
  actorUserId: string
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "User",
      entityId: user.id,
      action: "CREATE",
      metadata: { name: user.name, email: user.email, role: user.role },
    });

    return { success: true, user };
  } catch (error) {
    logger.error("createUser error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUserRole(
  id: string,
  role: UserRole,
  actorUserId: string
) {
  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true },
    });

    if (!existing) {
      return { success: false, error: "User not found" };
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    await createAuditLog({
      actorUserId,
      entityType: "User",
      entityId: id,
      action: "ROLE_CHANGE",
      metadata: {
        name: user.name,
        from: existing.role,
        to: role,
      },
    });

    return { success: true, user };
  } catch (error) {
    logger.error("updateUserRole error:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function deleteUser(id: string, actorUserId: string) {
  try {
    if (id === actorUserId) {
      return { success: false, error: "You cannot delete your own account" };
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      actorUserId,
      entityType: "User",
      entityId: id,
      action: "DELETE",
      metadata: { name: user.name, email: user.email },
    });

    return { success: true };
  } catch (error) {
    logger.error("deleteUser error:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
