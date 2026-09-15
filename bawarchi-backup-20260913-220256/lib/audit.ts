import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

type AuditInput = {
  branchId?: string;
  staffId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput) {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    action: input.action,
    entityType: input.entityType,
    ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
    ...(input.staffId !== undefined ? { staffId: input.staffId } : {}),
    ...(input.entityId !== undefined ? { entityId: input.entityId } : {}),
    ...(input.metadata !== undefined
      ? { metadata: input.metadata as Prisma.InputJsonValue }
      : {}),
  };

  return prisma.auditLog.create({ data });
}
