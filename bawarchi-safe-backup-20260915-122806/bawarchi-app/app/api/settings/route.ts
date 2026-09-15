import { getSettingsDashboard } from "@/app/settings/actions";
import { apiError, apiSuccess } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return apiSuccess(await getSettingsDashboard()); } catch (error) { return apiError(error, request, "/api/settings"); } }
