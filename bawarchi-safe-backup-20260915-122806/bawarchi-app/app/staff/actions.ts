"use server";
import { revalidatePath } from "next/cache";
import { StaffStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/serializers";
import { recordAudit } from "@/lib/audit";

async function context() {
  const branch = await prisma.branch.findFirst({ where: { isActive: true, restaurant: { isActive: true } }, orderBy: { createdAt: "asc" }, select: { id: true, restaurantId: true, name: true } });
  if (!branch) throw new Error("No active branch is configured.");
  return branch;
}
export async function getStaff() {
  const branch = await context();
  const [staff, roles] = await Promise.all([
    prisma.staff.findMany({ where: { restaurantId: branch.restaurantId, OR: [{ branchId: branch.id }, { branchId: null }] }, select: { id: true, username: true, fullName: true, phone: true, email: true, status: true, branchId: true, createdAt: true, roles: { include: { role: true } } }, orderBy: { fullName: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, description: true } }),
  ]);
  return serializeData({ branch, staff, roles });
}
export async function createStaff(input: { username: string; fullName: string; phone?: string; email?: string; roleIds?: string[] }) {
  const branch = await context();
  const username = input.username.trim().toLowerCase(), fullName = input.fullName.trim();
  if (!username || !fullName) throw new Error("Username and full name are required.");
  const roleIds = [...new Set(input.roleIds ?? [])];
  const roles = await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true } });
  if (roles.length !== roleIds.length) throw new Error("One or more selected roles do not exist.");
  const result = await prisma.staff.create({ data: { restaurantId: branch.restaurantId, branchId: branch.id, username, fullName, phone: input.phone?.trim().slice(0, 40) || null, email: input.email?.trim().slice(0, 120) || null, roles: { create: roleIds.map(roleId => ({ roleId })) } }, select: { id: true, username: true, fullName: true, phone: true, email: true, status: true, roles: { include: { role: true } } } });
  await recordAudit({ branchId: branch.id, action: "STAFF_CHANGED", entityType: "STAFF", entityId: result.id, metadata: { action: "created" } });
  revalidatePath("/staff"); return serializeData(result);
}
export async function deactivateStaff(staffId: string) {
  const branch = await context();
  const result = await prisma.staff.updateMany({ where: { id: staffId, restaurantId: branch.restaurantId, branchId: branch.id, status: StaffStatus.ACTIVE }, data: { status: StaffStatus.INACTIVE } });
  if (!result.count) throw new Error("Active staff member not found.");
  await recordAudit({ branchId: branch.id, action: "STAFF_CHANGED", entityType: "STAFF", entityId: staffId, metadata: { action: "deactivated" } });
  revalidatePath("/staff"); return { id: staffId, status: StaffStatus.INACTIVE };
}
