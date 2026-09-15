import { getKitchenData, updateKOTStatus } from "@/app/orders/actions";
import { KOTStatus } from "@/generated/prisma/enums";
import { apiError, apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return apiSuccess(await getKitchenData());
  } catch (error) {
    return apiError(error, request, "/api/kitchen");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    return apiSuccess(await updateKOTStatus(String(body.kotId), body.status as KOTStatus));
  } catch (error) {
    return apiError(error, request, "/api/kitchen");
  }
}
