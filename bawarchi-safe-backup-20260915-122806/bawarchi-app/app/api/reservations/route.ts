import { ReservationStatus } from "@/generated/prisma/enums";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createReservation, getReservations, updateReservationStatus } from "@/app/reservations/actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { return apiSuccess(await getReservations()); } catch (error) { return apiError(error, request, "/api/reservations"); }
}

export async function POST(request: Request) {
  try { return apiSuccess(await createReservation(await request.json()), { status: 201 }); } catch (error) { return apiError(error, request, "/api/reservations"); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    return apiSuccess(await updateReservationStatus(String(body.id), body.status as ReservationStatus));
  } catch (error) { return apiError(error, request, "/api/reservations"); }
}
