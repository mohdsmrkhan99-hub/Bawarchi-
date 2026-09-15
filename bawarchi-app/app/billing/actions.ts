"use server";

import { revalidatePath } from "next/cache";
import { BillStatus, OrderStatus, PaymentMethod, PaymentStatus, PrintDocumentType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { serializeData, serializeMoney, serializeOrder } from "@/lib/serializers";
import { recordAudit } from "@/lib/audit";

async function branch() {
  const value = await prisma.branch.findFirst({ where: { isActive: true, restaurant: { isActive: true } }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!value) throw new Error("No active branch is configured.");
  return value;
}
const amount = (value: unknown) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0 || n > 1e9) throw new Error("Invalid amount.");
  return Math.round(n * 100) / 100;
};

export async function getBills() {
  const b = await branch();
  const bills = await prisma.bill.findMany({
    where: { branchId: b.id }, orderBy: { createdAt: "desc" }, take: 100,
    include: { order: { include: { items: true, table: { include: { floor: true, section: true } } } }, payments: true },
  });
  return serializeData(bills.map(bill => ({ ...bill, subtotal: serializeMoney(bill.subtotal), discount: serializeMoney(bill.discount), tax: serializeMoney(bill.tax), serviceCharge: serializeMoney(bill.serviceCharge), deliveryCharge: serializeMoney(bill.deliveryCharge), total: serializeMoney(bill.total), payments: bill.payments.map(payment => ({ ...payment, amount: serializeMoney(payment.amount) })), order: serializeOrder(bill.order) })));
}

export async function getBillableOrders() {
  const b = await branch();
  const orders = await prisma.order.findMany({
    where: { branchId: b.id, status: OrderStatus.SERVED },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, table: { select: { tableNumber: true, floor: { select: { name: true } } } } },
  });
  return orders.map(serializeOrder);
}

export async function createBill(orderId: string, idempotencyKey?: string) {
  const b = await branch();
  return prisma.$transaction(async tx => {
    if (idempotencyKey) {
      const existing = await tx.bill.findFirst({ where: { branchId: b.id, idempotencyKey } });
      if (existing) return existing;
    }
    const order = await tx.order.findFirst({ where: { id: orderId, branchId: b.id, status: OrderStatus.SERVED } });
    if (!order) throw new Error("Only served orders can be billed.");
    const existing = await tx.bill.findUnique({ where: { orderId } });
    if (existing) return existing;
    const sequence = await tx.billSequence.upsert({ where: { branchId: b.id }, create: { branchId: b.id, nextNumber: 2 }, update: { nextNumber: { increment: 1 } } });
    const number = sequence.nextNumber - 1;
    const bill = await tx.bill.create({ data: { branchId: b.id, orderId, billNumber: `BILL-${String(number).padStart(6, "0")}`, subtotal: order.subtotal, discount: order.discount, tax: order.tax, serviceCharge: order.serviceCharge, deliveryCharge: order.deliveryCharge, total: order.total, idempotencyKey } });
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.BILLED, version: { increment: 1 } } });
    return bill;
  }).then(async result => { await recordAudit({ branchId: b.id, action: "BILL_CREATED", entityType: "BILL", entityId: result.id, metadata: { orderId } }); revalidatePath("/billing"); revalidatePath("/orders"); return result; });
}

export async function recordPayment(billId: string, method: PaymentMethod, rawAmount: unknown, reference?: string, idempotencyKey?: string) {
  const paidAmount = amount(rawAmount);
  if (!paidAmount) throw new Error("Payment amount must be positive.");
  const b = await branch();
  return prisma.$transaction(async tx => {
    const bill = await tx.bill.findFirst({ where: { id: billId, branchId: b.id }, include: { payments: { where: { status: PaymentStatus.SUCCESS } } } });
    if (!bill || bill.status === BillStatus.VOID) throw new Error("Bill not found.");
    if (idempotencyKey) {
      const previous = await tx.payment.findFirst({ where: { billId, idempotencyKey } });
      if (previous) return previous;
    }
    const alreadyPaid = bill.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (alreadyPaid + paidAmount > Number(bill.total) + 0.01) throw new Error("Payment exceeds bill total.");
    const payment = await tx.payment.create({ data: { billId, method, amount: paidAmount, reference: reference?.trim().slice(0, 120) || null, idempotencyKey } });
    if (alreadyPaid + paidAmount >= Number(bill.total) - 0.01) {
      await tx.bill.update({ where: { id: billId }, data: { status: BillStatus.PAID } });
      await tx.order.update({ where: { id: bill.orderId }, data: { status: OrderStatus.PAID, version: { increment: 1 } } });
    }
    return payment;
  }).then(async result => { await recordAudit({ branchId: b.id, action: "PAYMENT_CREATED", entityType: "PAYMENT", entityId: result.id, metadata: { billId, method } }); revalidatePath("/billing"); revalidatePath("/orders"); revalidatePath("/tables"); return result; });
}

export async function createPrintJob(input: { documentType: PrintDocumentType; orderId?: string; kotId?: string; billId?: string; printerId?: string; idempotencyKey?: string }) {
  const b = await branch();
  return prisma.printJob.upsert({
    where: { branchId_idempotencyKey: { branchId: b.id, idempotencyKey: input.idempotencyKey ?? `auto-${input.documentType}-${input.billId ?? input.kotId ?? input.orderId ?? "test"}` } },
    create: { branchId: b.id, documentType: input.documentType, orderId: input.orderId, kotId: input.kotId, billId: input.billId, printerId: input.printerId, idempotencyKey: input.idempotencyKey ?? `auto-${input.documentType}-${input.billId ?? input.kotId ?? input.orderId ?? "test"}` },
    update: {},
  });
}

export async function getPrinters() {
  const b = await branch();
  return serializeData(await prisma.printer.findMany({ where: { branchId: b.id }, orderBy: { name: "asc" } }));
}

export async function createPrinter(input: { name: string; type?: string; connectionType?: "NETWORK" | "USB" | "LOCAL_AGENT" | "BROWSER"; purpose: "BILL" | "KOT" | "KITCHEN"; station?: string; ipAddress?: string; port?: number; paperWidth?: number }) {
  const b = await branch();
  if (!input.name.trim()) throw new Error("Printer name is required.");
  return prisma.printer.create({ data: { branchId: b.id, name: input.name.trim().slice(0, 120), type: input.type?.trim().slice(0, 60) || "THERMAL", connectionType: input.connectionType ?? "BROWSER", purpose: input.purpose, station: input.station?.trim().slice(0, 80), ipAddress: input.ipAddress?.trim().slice(0, 80), port: input.port, paperWidth: input.paperWidth === 58 ? 58 : 80 } });
}

export async function completeOrder(orderId: string) {
  const b = await branch();
  const order = await prisma.order.findFirst({ where: { id: orderId, branchId: b.id, status: OrderStatus.PAID } });
  if (!order) throw new Error("Only paid orders can be completed.");
  return prisma.$transaction(async tx => {
    const updated = await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.COMPLETED, version: { increment: 1 } } });
    if (order.tableId) await tx.diningTable.updateMany({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });
    return updated;
  }).then(result => { revalidatePath("/orders"); revalidatePath("/tables"); return result; });
}
