import { NextResponse } from "next/server";
import { errorDetails, logServerError, requestId } from "./server-errors";
import { serializeData } from "./serializers";

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data: serializeData(data) }, init);
}

export function apiError(error: unknown, request: Request, route: string) {
  const id = requestId(request);
  const details = errorDetails(error);
  logServerError(error, { requestId: id, route });
  return NextResponse.json(
    { success: false, error: { code: details.code, message: details.message }, requestId: id },
    { status: details.status, headers: { "x-request-id": id } },
  );
}
