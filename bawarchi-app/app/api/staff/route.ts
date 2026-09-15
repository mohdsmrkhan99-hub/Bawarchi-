import { createStaff, deactivateStaff, getStaff } from "@/app/staff/actions";
import { apiError, apiSuccess } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return apiSuccess(await getStaff()); } catch (error) { return apiError(error, request, "/api/staff"); } }
export async function POST(request: Request) { try { const body = await request.json(); return apiSuccess(await createStaff(body), { status: 201 }); } catch (error) { return apiError(error, request, "/api/staff"); } }
export async function PATCH(request: Request) { try { const body = await request.json(); if (body.status !== "INACTIVE") throw new Error("Only deactivation is supported."); return apiSuccess(await deactivateStaff(String(body.staffId))); } catch (error) { return apiError(error, request, "/api/staff"); } }
