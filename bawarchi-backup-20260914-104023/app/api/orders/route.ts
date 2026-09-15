import { createKOT, createOrder, getOrderData, updateOrder, updateOrderStatus } from "@/app/orders/actions";
import { OrderStatus, OrderType } from "@/generated/prisma/enums";
import { apiError, apiSuccess } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return apiSuccess(await getOrderData()); } catch (e) { return apiError(e, request, "/api/orders"); } }
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "status") return apiSuccess(await updateOrderStatus(String(body.orderId), body.status as OrderStatus, Number(body.version)));
    if (body.action === "kot") return apiSuccess(await createKOT(String(body.orderId), typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined), { status: 201 });
    if (body.action === "update") return apiSuccess(await updateOrder(String(body.orderId), body as never, Number(body.version)));
    const result = await createOrder({ ...body, orderType: body.orderType as OrderType, items: body.items as never[] } as never);
    return apiSuccess(result, { status: 201 });
  } catch (e) { return apiError(e, request, "/api/orders"); }
}
