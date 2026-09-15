import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const branch = await prisma.branch.findFirst({ where: { isActive: true, restaurant: { isActive: true } }, orderBy: { createdAt: "asc" }, select: { id: true } });
    if (!branch) throw new Error("No active branch is configured.");
    const logs = await prisma.auditLog.findMany({ where: { branchId: branch.id }, orderBy: { createdAt: "desc" }, take: 200 });
    return apiSuccess(serializeData(logs));
  } catch (error) {
    return apiError(error, request, "/api/audit");
  }
}
