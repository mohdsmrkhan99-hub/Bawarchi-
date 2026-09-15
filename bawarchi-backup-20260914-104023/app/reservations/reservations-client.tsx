"use client";

import { useState } from "react";

type Reservation = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  partySize: number;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  table: { tableNumber: string; floor: { name: string } };
};

export default function ReservationsClient({ initialReservations }: { initialReservations: Reservation[] }) {
  const [reservations, setReservations] = useState(initialReservations);
  const [message, setMessage] = useState("");

  async function update(id: string, status: string) {
    const response = await fetch("/api/reservations", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message ?? "Unable to update reservation.");
    setReservations(items => items.map(item => item.id === id ? { ...item, status } : item));
  }

  return <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-8"><div className="mx-auto max-w-5xl">
    <h1 className="text-3xl font-black">Reservations</h1>
    <p className="mb-6 text-sm text-slate-500">Database-backed table reservations and seating status.</p>
    {message && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <section className="space-y-3">{reservations.map(reservation => <article key={reservation.id} className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3"><div className="mr-auto"><h2 className="font-bold">{reservation.customerName} · {reservation.partySize} guests</h2><p className="text-sm text-slate-500">{reservation.table.floor.name} · Table {reservation.table.tableNumber} · {new Date(reservation.startsAt).toLocaleString()}</p>{reservation.customerPhone && <p className="text-sm text-slate-500">{reservation.customerPhone}</p>}</div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{reservation.status}</span></div>
      <div className="mt-4 flex flex-wrap gap-2">{reservation.status === "CONFIRMED" && <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white" onClick={() => update(reservation.id, "SEATED")}>Seat</button>}{reservation.status === "SEATED" && <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white" onClick={() => update(reservation.id, "COMPLETED")}>Complete</button>}{!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(reservation.status) && <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => update(reservation.id, "CANCELLED")}>Cancel</button>}</div>
    </article>)}{!reservations.length && <p className="rounded-2xl border bg-white p-8 text-center text-slate-500">No reservations found.</p>}</section>
  </div></main>;
}
