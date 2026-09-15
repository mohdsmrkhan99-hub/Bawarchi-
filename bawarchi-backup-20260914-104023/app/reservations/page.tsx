import { getReservations } from "./actions";
import ReservationsClient from "./reservations-client";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  return <ReservationsClient initialReservations={await getReservations()} />;
}
