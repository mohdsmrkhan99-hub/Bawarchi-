"use server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/serializers";
export async function getSettingsDashboard() {
  const branch = await prisma.branch.findFirst({ where: { isActive: true, restaurant: { isActive: true } }, orderBy: { createdAt: "asc" }, include: { restaurant: true } });
  if (!branch) throw new Error("No active branch is configured.");
  const [tables, menuItems, staff, printers, openOrders] = await Promise.all([
    prisma.diningTable.count({ where: { floor: { branchId: branch.id }, isActive: true } }),
    prisma.menuItem.count({ where: { category: { branchId: branch.id }, isActive: true } }),
    prisma.staff.count({ where: { restaurantId: branch.restaurantId, status: "ACTIVE" } }),
    prisma.printer.count({ where: { branchId: branch.id, isActive: true } }),
    prisma.order.count({ where: { branchId: branch.id, status: { notIn: ["COMPLETED", "CANCELLED", "ARCHIVED"] } } }),
  ]);
  return serializeData({ restaurant: branch.restaurant, branch: { id: branch.id, name: branch.name, code: branch.code, address: branch.address, phone: branch.phone, isActive: branch.isActive }, modules: { tables, menuItems, staff, printers, openOrders } });
}
