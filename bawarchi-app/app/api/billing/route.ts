import { completeOrder, createBill, getBillableOrders, getBills, recordPayment, createPrintJob } from "@/app/billing/actions";
import { PaymentMethod, PrintDocumentType } from "@/generated/prisma/enums";
import { apiError, apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return apiSuccess({ bills: await getBills(), billableOrders: await getBillableOrders() }); }
  catch (error) { return apiError(error, request, "/api/billing"); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "bill") return apiSuccess(await createBill(String(body.orderId), typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined), { status: 201 });
    if (body.action === "payment") return apiSuccess(await recordPayment(String(body.billId), body.method as PaymentMethod, body.amount, typeof body.reference === "string" ? body.reference : undefined, typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined), { status: 201 });
    if (body.action === "complete") return apiSuccess(await completeOrder(String(body.orderId)));
    if (body.action === "print") return apiSuccess(await createPrintJob({ documentType: body.documentType as PrintDocumentType, orderId: typeof body.orderId === "string" ? body.orderId : undefined, billId: typeof body.billId === "string" ? body.billId : undefined, kotId: typeof body.kotId === "string" ? body.kotId : undefined, printerId: typeof body.printerId === "string" ? body.printerId : undefined, idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined }), { status: 201 });
    return apiError(new Error("Unknown billing action."), request, "/api/billing");
  } catch (error) { return apiError(error, request, "/api/billing"); }
}
