"use server";

import { revalidatePath } from "next/cache";
import { KOTItemStatus, KOTStatus, OrderStatus, OrderType, TableStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { serializeData, serializeMenu, serializeOrder } from "@/lib/serializers";
import { recordAudit } from "@/lib/audit";

type ItemInput = { menuItemId: string; menuVariantId?: string; quantity: number; notes?: string };
type OrderInput = {
  orderType: OrderType; tableId?: string; customerName?: string; customerPhone?: string;
  customerAddress?: string; notes?: string; discount?: number; tax?: number;
  serviceCharge?: number; deliveryCharge?: number; items: ItemInput[]; idempotencyKey?: string;
};
const clean = (v: unknown, max = 240) => typeof v === "string" ? v.trim().slice(0, max) || null : null;
const money = (v: unknown) => { const n = Number(v ?? 0); if (!Number.isFinite(n) || n < 0 || n > 1e9) throw new Error("Invalid amount."); return Math.round(n * 100) / 100; };
async function branch() {
  const b = await prisma.branch.findFirst({ where: { isActive: true, restaurant: { isActive: true } }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!b) throw new Error("No active branch is configured.");
  return b;
}
export async function getOrderData() {
  const b = await branch();
  const [menu, floors, orders] = await Promise.all([
    prisma.menuCategory.findMany({ where: { branchId: b.id, isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { items: { where: { isActive: true, isAvailable: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { variants: { where: { isActive: true, isAvailable: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] } } } } }),
    prisma.floor.findMany({ where: { branchId: b.id, isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { tables: { where: { isActive: true }, orderBy: { tableNumber: "asc" }, select: { id: true, tableNumber: true, name: true, capacity: true, status: true } }, sections: { where: { isActive: true }, include: { tables: { where: { isActive: true }, select: { id: true, tableNumber: true, name: true, capacity: true, status: true } } } } } }),
    prisma.order.findMany({ where: { branchId: b.id, status: { not: OrderStatus.ARCHIVED } }, orderBy: { createdAt: "desc" }, take: 100, include: { items: true, table: { select: { tableNumber: true, floor: { select: { name: true } }, section: { select: { name: true } } } } } }),
  ]);
  return serializeData({ menu: serializeMenu(menu), floors, orders: orders.map(serializeOrder) });
}

export async function getKitchenData() {
  const b = await branch();
  const kots = await prisma.kOT.findMany({
    where: { branchId: b.id, status: { in: [KOTStatus.NEW, KOTStatus.PREPARING, KOTStatus.READY] } },
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      order: { select: { orderNumber: true, orderType: true, table: { select: { tableNumber: true } } } },
    },
  });
  return kots.map(kot => ({
    ...kot,
    createdAt: kot.createdAt.toISOString(),
    updatedAt: kot.updatedAt.toISOString(),
    items: kot.items.map(item => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
  }));
}

export async function createKOT(orderId: string, idempotencyKey?: string) {
  const b = await branch();
  return prisma.$transaction(async tx => {
    if (idempotencyKey) {
      const existing = await tx.kOT.findFirst({ where: { branchId: b.id, idempotencyKey }, include: { items: true } });
      if (existing) return existing;
    }
    const order = await tx.order.findFirst({
      where: { id: orderId, branchId: b.id, status: { in: [OrderStatus.CONFIRMED, OrderStatus.KOT_SENT, OrderStatus.PREPARING, OrderStatus.READY] } },
      include: { items: true },
    });
    if (!order) throw new Error("Only confirmed orders can be sent to the kitchen.");
    if (!order.items.length) throw new Error("Cannot send an empty order to the kitchen.");
    const sequence = await tx.kOTSequence.upsert({
      where: { branchId: b.id },
      create: { branchId: b.id, nextNumber: 2 },
      update: { nextNumber: { increment: 1 } },
    });
    const number = sequence.nextNumber - 1;
    const sentItemIds = (await tx.kOTItem.findMany({ where: { kot: { orderId } }, select: { orderItemId: true } })).map(item => item.orderItemId);
    const pendingItems = order.items.filter(item => !sentItemIds.includes(item.id));
    if (!pendingItems.length) throw new Error("No new items to send to the kitchen.");
    const kot = await tx.kOT.create({
      data: {
        branchId: b.id,
        orderId: order.id,
        kotNumber: `KOT-${String(number).padStart(6, "0")}`,
        notes: order.notes,
        idempotencyKey,
        items: {
          create: pendingItems.map(item => ({
            orderItemId: item.id,
            itemName: item.itemName,
            variantName: item.variantName,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });
    if (order.status === OrderStatus.CONFIRMED) await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.KOT_SENT, version: { increment: 1 } } });
    return kot;
  }).then(async result => {
    await recordAudit({ branchId: b.id, action: "KOT_CREATED", entityType: "KOT", entityId: result.id, metadata: { orderId } });
    revalidatePath("/orders");
    revalidatePath("/kitchen");
    return result;
  });
}

const kotTransitions: Record<KOTStatus, KOTStatus[]> = {
  NEW: [KOTStatus.PREPARING, KOTStatus.CANCELLED],
  PREPARING: [KOTStatus.READY, KOTStatus.CANCELLED],
  READY: [KOTStatus.SERVED],
  SERVED: [],
  CANCELLED: [],
};

export async function updateKOTStatus(kotId: string, status: KOTStatus) {
  const b = await branch();
  return prisma.$transaction(async tx => {
    const kot = await tx.kOT.findFirst({ where: { id: kotId, branchId: b.id }, include: { order: true } });
    if (!kot) throw new Error("Kitchen order not found.");
    if (!kotTransitions[kot.status].includes(status)) throw new Error(`Cannot move ${kot.status} to ${status}.`);
    await tx.kOT.update({ where: { id: kot.id }, data: { status, items: { updateMany: { where: { status: { not: KOTItemStatus.CANCELLED } }, data: { status: status === KOTStatus.PREPARING ? KOTItemStatus.PREPARING : status === KOTStatus.READY ? KOTItemStatus.READY : status === KOTStatus.SERVED ? KOTItemStatus.SERVED : KOTItemStatus.CANCELLED } } } } });
    const orderStatus = status === KOTStatus.PREPARING ? OrderStatus.PREPARING : status === KOTStatus.READY ? OrderStatus.READY : status === KOTStatus.SERVED ? OrderStatus.SERVED : OrderStatus.CANCELLED;
    if (kot.order.status !== orderStatus) await tx.order.update({ where: { id: kot.orderId }, data: { status: orderStatus, version: { increment: 1 } } });
    return { ok: true };
  }).then(async result => {
    await recordAudit({ branchId: b.id, action: "KITCHEN_STATUS_CHANGED", entityType: "KOT", entityId: kotId, metadata: { status } });
    revalidatePath("/orders");
    revalidatePath("/kitchen");
    return result;
  });
}
export async function createOrder(input: OrderInput) {
  const b = await branch();
  if (![OrderType.DINE_IN, OrderType.TAKEAWAY, OrderType.DELIVERY].includes(input.orderType)) throw new Error("Invalid order type.");
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) throw new Error("Add at least one item.");
  if (input.orderType === OrderType.DINE_IN && !input.tableId) throw new Error("Select a table for dine-in.");
  if (input.orderType === OrderType.DELIVERY && !clean(input.customerAddress, 500)) throw new Error("Delivery address is required.");
  const discount = money(input.discount), tax = money(input.tax), serviceCharge = money(input.serviceCharge), deliveryCharge = money(input.deliveryCharge);
  return prisma.$transaction(async tx => {
    if (input.idempotencyKey) {
      const existing = await tx.order.findFirst({
        where: { branchId: b.id, idempotencyKey: input.idempotencyKey },
        include: { items: true },
      });
      if (existing) return existing;
    }
    const tableId: string | null = input.tableId ?? null;
    let table;
    if (tableId) {
      table = await tx.diningTable.findFirst({ where: { id: tableId, floor: { branchId: b.id }, isActive: true } });
      if (!table) throw new Error("Table not found.");
      if (input.orderType !== OrderType.DINE_IN) throw new Error("Only dine-in orders can use a table.");
      const claimed = await tx.diningTable.updateMany({ where: { id: tableId, status: TableStatus.AVAILABLE }, data: { status: TableStatus.OCCUPIED } });
      if (claimed.count !== 1) throw new Error("That table is no longer available.");
    }
    const ids = input.items.map(i => i.menuItemId);
    const items = await tx.menuItem.findMany({ where: { id: { in: ids }, category: { branchId: b.id }, isActive: true, isAvailable: true }, include: { variants: { where: { isActive: true, isAvailable: true } } } });
    const byId = new Map(items.map(i => [i.id, i]));
    const lines = input.items.map(raw => {
      const item = byId.get(raw.menuItemId); const qty = Number(raw.quantity);
      if (!item || !Number.isInteger(qty) || qty < 1 || qty > 999) throw new Error("Invalid menu item or quantity.");
      const variant = raw.menuVariantId ? item.variants.find(v => v.id === raw.menuVariantId) : item.variants[0];
      if (!variant) throw new Error(`No available variant for ${item.name}.`);
      const unit = Number(variant.price); return { menuItemId: item.id, menuVariantId: variant.id, itemName: item.name, variantName: variant.name, unitPrice: unit, quantity: qty, notes: clean(raw.notes, 300), lineTotal: unit * qty };
    });
    const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    if (discount > subtotal) throw new Error("Discount cannot exceed subtotal.");
    const total = Math.max(0, Math.round((subtotal - discount + tax + serviceCharge + deliveryCharge) * 100) / 100);
    const sequence = await tx.orderSequence.upsert({ where: { branchId: b.id }, create: { branchId: b.id, nextNumber: 2 }, update: { nextNumber: { increment: 1 } } });
    const number = sequence.nextNumber - 1;
    const order = await tx.order.create({ data: { branchId: b.id, orderNumber: `ORD-${String(number).padStart(6, "0")}`, orderType: input.orderType, status: OrderStatus.PLACED, tableId, customerName: clean(input.customerName, 120), customerPhone: clean(input.customerPhone, 40), customerAddress: clean(input.customerAddress, 500), notes: clean(input.notes, 500), subtotal, discount, tax, serviceCharge, deliveryCharge, total, idempotencyKey: clean(input.idempotencyKey, 120), items: { create: lines } }, include: { items: true } });
    return order;
  }).then(async result => {
    await recordAudit({ branchId: b.id, action: "ORDER_CREATED", entityType: "ORDER", entityId: result.id, metadata: { orderType: result.orderType } });
    revalidatePath("/orders");
    return serializeOrder(result);
  });
}
export async function updateOrder(orderId: string, input: OrderInput, version: number) {
  const b = await branch();
  if (!input.items?.length) throw new Error("Order must contain at least one item.");
  const discount = money(input.discount), tax = money(input.tax), serviceCharge = money(input.serviceCharge), deliveryCharge = money(input.deliveryCharge);
  return prisma.$transaction(async tx => {
    const current = await tx.order.findFirst({ where: { id: orderId, branchId: b.id, status: { in: [OrderStatus.DRAFT, OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PREPARING] } } });
    if (!current || current.version !== version) throw new Error("Order changed; refresh and try again.");
    const menu = await tx.menuItem.findMany({ where: { id: { in: input.items.map(i => i.menuItemId) }, category: { branchId: b.id }, isActive: true, isAvailable: true }, include: { variants: { where: { isActive: true, isAvailable: true } } } });
    const lines = input.items.map(raw => { const item = menu.find(i => i.id === raw.menuItemId); const v = item?.variants.find(x => x.id === raw.menuVariantId); const qty = Number(raw.quantity); if (!item || !v || !Number.isInteger(qty) || qty < 1 || qty > 999) throw new Error("Invalid active menu item or variant."); const unit = Number(v.price); return { menuItemId:item.id, menuVariantId:v.id, itemName:item.name, variantName:v.name, unitPrice:unit, quantity:qty, notes:clean(raw.notes,300), lineTotal:unit*qty }; });
    const subtotal = Math.round(lines.reduce((s,l)=>s+l.lineTotal,0)*100)/100;
    if (discount > subtotal) throw new Error("Discount cannot exceed subtotal.");
    const total = Math.round((subtotal-discount+tax+serviceCharge+deliveryCharge)*100)/100;
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.order.update({ where: { id: orderId }, data: { customerName:clean(input.customerName,120), customerPhone:clean(input.customerPhone,40), customerAddress:clean(input.customerAddress,500), notes:clean(input.notes,500), subtotal,discount,tax,serviceCharge,deliveryCharge,total,version:{increment:1},items:{create:lines} } });
    return { ok:true };
  }).then(r=>{ revalidatePath("/orders"); return r; });
}
const transitions: Record<OrderStatus, OrderStatus[]> = { DRAFT: [OrderStatus.PLACED, OrderStatus.CANCELLED], PLACED: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED], CONFIRMED: [OrderStatus.KOT_SENT, OrderStatus.CANCELLED], KOT_SENT: [OrderStatus.PREPARING, OrderStatus.CANCELLED], PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED], READY: [OrderStatus.SERVED], SERVED: [OrderStatus.BILLED, OrderStatus.CANCELLED], BILLED: [OrderStatus.PAID, OrderStatus.CANCELLED], PAID: [OrderStatus.COMPLETED], COMPLETED: [OrderStatus.ARCHIVED], CANCELLED: [OrderStatus.ARCHIVED], ARCHIVED: [] };
export async function updateOrderStatus(orderId: string, status: OrderStatus, version: number) {
  const b = await branch();
  return prisma.$transaction(async tx => {
    const current = await tx.order.findFirst({ where: { id: orderId, branchId: b.id } });
    if (!current || current.version !== version) throw new Error("Order changed; refresh and try again.");
    if (!transitions[current.status].includes(status)) throw new Error(`Cannot move ${current.status} to ${status}.`);
    const updated = await tx.order.updateMany({ where: { id: orderId, branchId: b.id, version }, data: { status, version: { increment: 1 } } });
    if (updated.count !== 1) throw new Error("Order changed; refresh and try again.");
    if ((status === OrderStatus.CANCELLED || status === OrderStatus.COMPLETED || status === OrderStatus.ARCHIVED) && current.tableId) {
      const active = await tx.order.count({ where: { tableId: current.tableId, id: { not: current.id }, status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.ARCHIVED] } } });
      if (!active) await tx.diningTable.updateMany({ where: { id: current.tableId, status: { in: [TableStatus.OCCUPIED, TableStatus.PREPARING, TableStatus.READY, TableStatus.BILL_REQUESTED] } }, data: { status: TableStatus.AVAILABLE } });
    }
    return { ok: true };
  }).then(result => { revalidatePath("/orders"); revalidatePath("/tables"); return result; });
}
