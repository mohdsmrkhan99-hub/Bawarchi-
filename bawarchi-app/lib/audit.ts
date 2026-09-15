import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

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
    ...(input.branchId ? { branchId: input.branchId } : {}),
    ...(input.staffId ? { staffId: input.staffId } : {}),
    ...(input.entityId ? { entityId: input.entityId } : {}),
    ...(input.metadata
      ? { metadata: input.metadata as Prisma.InputJsonValue }
      : {}),
  };

  return prisma.auditLog.create({ data });
}
