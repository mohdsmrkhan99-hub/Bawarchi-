import { getMenuManagementData, menuMutation } from "@/app/menu/actions";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(request: Request) {
  try { return apiSuccess(await getMenuManagementData()); }
  catch (error) { return apiError(error, request, "/api/menu"); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; [key: string]: unknown };
    if (!body.action) return apiError(new Error("Action is required."), request, "/api/menu");
    return apiSuccess(await menuMutation(body.action, body));
  } catch (error) { return apiError(error, request, "/api/menu"); }
}
