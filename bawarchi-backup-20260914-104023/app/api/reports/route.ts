import { getReports } from "@/app/reports/actions";
import { apiError, apiSuccess } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { const days = Number(new URL(request.url).searchParams.get("days") ?? 30); return apiSuccess(await getReports(days)); } catch (error) { return apiError(error, request, "/api/reports"); } }
