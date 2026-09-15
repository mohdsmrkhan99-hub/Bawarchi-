"use server";

import { prisma } from "@/lib/prisma";
import { serializeData, serializeMoney } from "@/lib/serializers";

async function activeBranch() {
  const branch = await prisma.branch.findFirst({
    where: { isActive: true, restaurant: { isActive: true } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!branch) throw new Error("No active branch is configured.");
  return branch;
}

export async function getReports(days = 30) {
  const branch = await activeBranch();
  const since = new Date();
  since.setDate(since.getDate() - Math.min(Math.max(days, 1), 365));
  const [orders, bills, payments] = await Promise.all([
    prisma.order.findMany({ where: { branchId: branch.id, createdAt: { gte: since } }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 5000 }),
    prisma.bill.findMany({ where: { branchId: branch.id, createdAt: { gte: since } }, select: { id: true, billNumber: true, total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5000 }),
    prisma.payment.findMany({ where: { bill: { branchId: branch.id }, createdAt: { gte: since }, status: "SUCCESS" }, select: { method: true, amount: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5000 }),
  ]);
  const itemMap = new Map<string, { itemName: string; quantity: number; revenue: number }>();
  for (const order of orders) for (const item of order.items) {
    const current = itemMap.get(item.itemName) ?? { itemName: item.itemName, quantity: 0, revenue: 0 };
    current.quantity += item.quantity; current.revenue += Number(item.lineTotal); itemMap.set(item.itemName, current);
  }
  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const byMethod = Object.fromEntries(["CASH", "CARD", "UPI", "OTHER"].map(method => [method, serializeMoney(payments.filter(p => p.method === method).reduce((sum, p) => sum + Number(p.amount), 0))]));
  return serializeData({
    range: { since, days },
    summary: { revenue: serializeMoney(revenue), payments: payments.length, orders: orders.length, bills: bills.length, averageOrder: serializeMoney(orders.length ? revenue / orders.length : 0) },
    paymentMethods: byMethod,
    topItems: [...itemMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map(item => ({ ...item, revenue: serializeMoney(item.revenue) })),
    recentBills: bills.slice(0, 20).map(bill => ({ ...bill, total: serializeMoney(bill.total) })),
  });
}
