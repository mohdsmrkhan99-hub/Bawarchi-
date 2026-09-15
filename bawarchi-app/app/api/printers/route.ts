import { createPrinter, createPrintJob, getPrinters } from "@/app/billing/actions";
import { apiError, apiSuccess } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return apiSuccess(await getPrinters()); } catch (e) { return apiError(e, request, "/api/printers"); } }
export async function POST(request: Request) {
  try { const body = await request.json() as Record<string, unknown>; if (body.action === "test") return apiSuccess(await createPrintJob({ documentType: "TEST", printerId: String(body.printerId), idempotencyKey: `test-${body.printerId}-${new Date().toISOString().slice(0, 10)}` })); return apiSuccess(await createPrinter({ name: String(body.name ?? ""), type: typeof body.type === "string" ? body.type : undefined, connectionType: body.connectionType as never, purpose: body.purpose as never, station: typeof body.station === "string" ? body.station : undefined, ipAddress: typeof body.ipAddress === "string" ? body.ipAddress : undefined, port: Number(body.port) || undefined, paperWidth: Number(body.paperWidth) || undefined }), { status: 201 }); } catch (e) { return apiError(e, request, "/api/printers"); }
}
