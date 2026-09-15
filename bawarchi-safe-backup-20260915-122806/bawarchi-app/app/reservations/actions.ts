"use server";

import { ReservationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/serializers";
import { recordAudit } from "@/lib/audit";

async function branch() {
  const value = await prisma.branch.findFirst({
    where: { isActive: true, restaurant: { isActive: true } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!value) throw new Error("No active branch is configured.");
  return value;
}

export async function getReservations() {
  const b = await branch();
  const reservations = await prisma.reservation.findMany({
    where: { branchId: b.id, status: { not: ReservationStatus.CANCELLED } },
    orderBy: { startsAt: "asc" },
    take: 200,
    include: { table: { select: { tableNumber: true, name: true, floor: { select: { name: true } }, section: { select: { name: true } } } } },
  });
  return reservations.map(reservation => ({
    ...serializeData(reservation),
    startsAt: reservation.startsAt.toISOString(),
    endsAt: reservation.endsAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  }));
}

export async function createReservation(input: { tableId: string; customerName: string; customerPhone?: string; partySize: number; startsAt: string; endsAt: string; notes?: string }) {
  const b = await branch();
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (!input.customerName?.trim()) throw new Error("Customer name is required.");
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 100) throw new Error("Party size must be between 1 and 100.");
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) throw new Error("Reservation time range is invalid.");
  const table = await prisma.diningTable.findFirst({ where: { id: input.tableId, isActive: true, floor: { branchId: b.id, isActive: true } }, select: { id: true, sectionId: true } });
  if (!table) throw new Error("Table not found.");
  const conflict = await prisma.reservation.findFirst({
    where: { tableId: table.id, status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.SEATED] }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { id: true },
  });
  if (conflict) throw new Error("That table is already reserved for the selected time.");
  const reservation = await prisma.reservation.create({
    data: { branchId: b.id, sectionId: table.sectionId, tableId: table.id, customerName: input.customerName.trim().slice(0, 120), customerPhone: input.customerPhone?.trim().slice(0, 30) || null, partySize: input.partySize, startsAt, endsAt, notes: input.notes?.trim().slice(0, 500) || null },
    include: { table: { select: { tableNumber: true, floor: { select: { name: true } } } } },
  });
  await recordAudit({ branchId: b.id, action: "RESERVATION_CREATED", entityType: "RESERVATION", entityId: reservation.id });
  return serializeData(reservation);
}

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const b = await branch();
  if (!Object.values(ReservationStatus).includes(status)) throw new Error("Invalid reservation status.");
  const result = await prisma.reservation.updateMany({ where: { id, branchId: b.id }, data: { status } });
  if (!result.count) throw new Error("Reservation not found.");
  await recordAudit({ branchId: b.id, action: "RESERVATION_STATUS_CHANGED", entityType: "RESERVATION", entityId: id, metadata: { status } });
  return { id, status };
}
