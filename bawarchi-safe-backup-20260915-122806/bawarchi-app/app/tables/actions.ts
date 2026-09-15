"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TableOperationType, TableStatus } from "@/generated/prisma/enums";

const MAX_NAME_LENGTH = 80;

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > MAX_NAME_LENGTH) {
    throw new Error(`${label} is required and must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }
  return value.trim();
}

function id(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value;
}

function capacity(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("Capacity must be a whole number from 1 to 100.");
  }
  return parsed;
}

function tableNumber(value: unknown) {
  const result = requiredText(value, "Table number");
  if (result.length > 20) throw new Error("Table number must be 20 characters or fewer.");
  return result;
}

async function activeBranch() {
  const branch = await prisma.branch.findFirst({
    where: { isActive: true, restaurant: { isActive: true } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!branch) throw new Error("No active branch is configured.");
  return branch;
}

export async function getTableManagementData() {
  const branch = await prisma.branch.findFirst({
    where: { isActive: true, restaurant: { isActive: true } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      floors: {
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: {
          sections: {
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
            include: {
              tables: {
                where: { isActive: true },
                orderBy: [{ displayOrder: "asc" }, { tableNumber: "asc" }],
                select: { id: true, tableNumber: true, name: true, capacity: true, status: true },
              },
            },
          },
          tables: {
            where: { isActive: true, sectionId: null },
            orderBy: [{ displayOrder: "asc" }, { tableNumber: "asc" }],
            select: { id: true, tableNumber: true, name: true, capacity: true, status: true },
          },
        },
      },
    },
  });
  return branch;
}

export async function createFloor(input: { name: string; description?: string }) {
  const branch = await activeBranch();
  const name = requiredText(input.name, "Floor name");
  const description = input.description?.trim().slice(0, 200) || null;
  const maxOrder = await prisma.floor.aggregate({ where: { branchId: branch.id }, _max: { displayOrder: true } });
  await prisma.floor.create({ data: { branchId: branch.id, name, description, displayOrder: (maxOrder._max.displayOrder ?? -1) + 1 } });
  revalidatePath("/tables");
}

export async function updateFloor(input: { floorId: string; name: string; description?: string }) {
  const branch = await activeBranch();
  const floorId = id(input.floorId, "Floor");
  const name = requiredText(input.name, "Floor name");
  const floor = await prisma.floor.findFirst({ where: { id: floorId, branchId: branch.id } });
  if (!floor) throw new Error("Floor not found.");
  await prisma.floor.update({ where: { id: floorId }, data: { name, description: input.description?.trim().slice(0, 200) || null } });
  revalidatePath("/tables");
}

export async function setFloorActive(input: { floorId: string; isActive: boolean }) {
  const branch = await activeBranch();
  const floorId = id(input.floorId, "Floor");
  const floor = await prisma.floor.findFirst({ where: { id: floorId, branchId: branch.id } });
  if (!floor) throw new Error("Floor not found.");
  await prisma.floor.update({ where: { id: floorId }, data: { isActive: Boolean(input.isActive) } });
  revalidatePath("/tables");
}

export async function reorderFloor(input: { floorId: string; direction: "up" | "down" }) {
  const branch = await activeBranch();
  const floorId = id(input.floorId, "Floor");
  if (input.direction !== "up" && input.direction !== "down") throw new Error("Invalid section direction.");
  const floors = await prisma.floor.findMany({ where: { branchId: branch.id, isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, displayOrder: true } });
  const index = floors.findIndex((floor) => floor.id === floorId);
  const swapIndex = input.direction === "up" ? index - 1 : index + 1;
  if (index < 0 || !floors[swapIndex]) return;
  await prisma.$transaction([
    prisma.floor.update({ where: { id: floors[index].id }, data: { displayOrder: floors[swapIndex].displayOrder } }),
    prisma.floor.update({ where: { id: floors[swapIndex].id }, data: { displayOrder: floors[index].displayOrder } }),
  ]);
  revalidatePath("/tables");
}

export async function deleteFloor(input: { floorId: string }) {
  const branch = await activeBranch();
  const floorId = id(input.floorId, "Floor");
  const floor = await prisma.floor.findFirst({ where: { id: floorId, branchId: branch.id }, include: { _count: { select: { tables: true } }, sections: { include: { _count: { select: { tables: true, reservations: true } } } } } });
  if (!floor) throw new Error("Floor not found.");
  if (floor._count.tables || floor.sections.some((section) => section._count.tables || section._count.reservations)) throw new Error("This floor has dependent tables or reservations. Deactivate it instead.");
  await prisma.$transaction([prisma.section.deleteMany({ where: { floorId } }), prisma.floor.delete({ where: { id: floorId } })]);
  revalidatePath("/tables");
}

export async function createSection(input: { floorId: string; name: string; description?: string }) {
  const branch = await activeBranch();
  const floorId = id(input.floorId, "Floor");
  const floor = await prisma.floor.findFirst({ where: { id: floorId, branchId: branch.id, isActive: true } });
  if (!floor) throw new Error("Floor not found.");
  const maxOrder = await prisma.section.aggregate({ where: { floorId }, _max: { displayOrder: true } });
  await prisma.section.create({ data: { branchId: branch.id, floorId, name: requiredText(input.name, "Section name"), description: input.description?.trim().slice(0, 200) || null, displayOrder: (maxOrder._max.displayOrder ?? -1) + 1 } });
  revalidatePath("/tables");
}

export async function updateSection(input: { sectionId: string; name: string; description?: string }) {
  const branch = await activeBranch();
  const sectionId = id(input.sectionId, "Section");
  const section = await prisma.section.findFirst({ where: { id: sectionId, branchId: branch.id } });
  if (!section) throw new Error("Section not found.");
  await prisma.section.update({ where: { id: sectionId }, data: { name: requiredText(input.name, "Section name"), description: input.description?.trim().slice(0, 200) || null } });
  revalidatePath("/tables");
}

export async function setSectionActive(input: { sectionId: string; isActive: boolean }) {
  const branch = await activeBranch();
  const sectionId = id(input.sectionId, "Section");
  const section = await prisma.section.findFirst({ where: { id: sectionId, branchId: branch.id } });
  if (!section) throw new Error("Section not found.");
  await prisma.section.update({ where: { id: sectionId }, data: { isActive: Boolean(input.isActive) } });
  revalidatePath("/tables");
}

export async function deleteSection(input: { sectionId: string }) {
  const branch = await activeBranch();
  const sectionId = id(input.sectionId, "Section");
  const section = await prisma.section.findFirst({ where: { id: sectionId, branchId: branch.id }, include: { _count: { select: { tables: true, reservations: true } } } });
  if (!section) throw new Error("Section not found.");
  if (section._count.tables || section._count.reservations) throw new Error("This section has dependent tables or reservations. Deactivate it instead.");
  await prisma.section.delete({ where: { id: sectionId } });
  revalidatePath("/tables");
}

export async function createTable(input: { floorId: string; sectionId?: string; tableNumber: string; name?: string; capacity: number; status?: TableStatus }) {
  const branch = await activeBranch();
  const floorId = id(input.floorId, "Floor");
  const floor = await prisma.floor.findFirst({ where: { id: floorId, branchId: branch.id, isActive: true }, select: { id: true } });
  if (!floor) throw new Error("Floor not found.");
  let sectionId: string | undefined;
  if (input.sectionId) {
    const section = await prisma.section.findFirst({ where: { id: id(input.sectionId, "Section"), floorId, branchId: branch.id, isActive: true }, select: { id: true } });
    if (!section) throw new Error("Section not found on this floor.");
    sectionId = section.id;
  }
  await prisma.diningTable.create({ data: { floorId, sectionId, tableNumber: tableNumber(input.tableNumber), name: input.name?.trim().slice(0, MAX_NAME_LENGTH) || null, capacity: capacity(input.capacity), status: input.status ?? TableStatus.AVAILABLE } });
  revalidatePath("/tables");
}

export async function updateTable(input: { tableId: string; floorId: string; sectionId?: string; tableNumber: string; name?: string; capacity: number; status?: TableStatus }) {
  const branch = await activeBranch();
  const tableId = id(input.tableId, "Table");
  const table = await prisma.diningTable.findFirst({ where: { id: tableId, floor: { branchId: branch.id, isActive: true }, OR: [{ section: { isActive: true } }, { sectionId: null }] } });
  if (!table) throw new Error("Table not found.");
  const floor = await prisma.floor.findFirst({ where: { id: id(input.floorId, "Floor"), branchId: branch.id, isActive: true } });
  if (!floor) throw new Error("Floor not found.");
  let sectionId: string | null = null;
  if (input.sectionId) {
    const section = await prisma.section.findFirst({ where: { id: input.sectionId, floorId: floor.id, branchId: branch.id, isActive: true } });
    if (!section) throw new Error("Section not found on this floor.");
    sectionId = section.id;
  }
  await prisma.diningTable.update({ where: { id: tableId }, data: { floorId: floor.id, sectionId, tableNumber: tableNumber(input.tableNumber), name: input.name?.trim().slice(0, MAX_NAME_LENGTH) || null, capacity: capacity(input.capacity), ...(input.status ? { status: input.status } : {}) } });
  revalidatePath("/tables");
}

export async function setTableActive(input: { tableId: string; isActive: boolean }) {
  const branch = await activeBranch();
  const tableId = id(input.tableId, "Table");
  const table = await prisma.diningTable.findFirst({ where: { id: tableId, floor: { branchId: branch.id } } });
  if (!table) throw new Error("Table not found.");
  if (!input.isActive && table.status !== TableStatus.AVAILABLE) throw new Error("Only available tables can be deactivated.");
  await prisma.diningTable.update({ where: { id: tableId }, data: { isActive: Boolean(input.isActive) } });
  revalidatePath("/tables");
}

export async function deleteTable(input: { tableId: string }) {
  const branch = await activeBranch();
  const tableId = id(input.tableId, "Table");
  const table = await prisma.diningTable.findFirst({ where: { id: tableId, floor: { branchId: branch.id } }, include: { _count: { select: { reservations: true, sourceOperations: true, targetOperations: true } } } });
  if (!table) throw new Error("Table not found.");
  if (table.status !== TableStatus.AVAILABLE || table._count.reservations || table._count.sourceOperations || table._count.targetOperations) {
    throw new Error("Only an unused available table can be deleted. Deactivate it instead.");
  }
  await prisma.diningTable.delete({ where: { id: tableId } });
  revalidatePath("/tables");
}

export async function setTableStatus(input: { tableId: string; status: TableStatus }) {
  const branch = await activeBranch();
  const tableId = id(input.tableId, "Table");
  if (!Object.values(TableStatus).includes(input.status)) throw new Error("Invalid table status.");
  const table = await prisma.diningTable.findFirst({ where: { id: tableId, floor: { branchId: branch.id, isActive: true }, OR: [{ section: { isActive: true } }, { sectionId: null }] } });
  if (!table) throw new Error("Table not found.");
  await prisma.diningTable.update({ where: { id: tableId }, data: { status: input.status } });
  revalidatePath("/tables");
}

export async function createReservation(input: { tableId: string; customerName: string; customerPhone?: string; partySize: number; startsAt: Date; endsAt: Date }) {
  const branch = await activeBranch();
  const tableId = id(input.tableId, "Table");
  const table = await prisma.diningTable.findFirst({ where: { id: tableId, isActive: true, floor: { branchId: branch.id, isActive: true }, OR: [{ section: { isActive: true } }, { sectionId: null }] }, select: { id: true, sectionId: true } });
  if (!table) throw new Error("Table not found.");
  if (!(input.startsAt instanceof Date) || !(input.endsAt instanceof Date) || input.endsAt <= input.startsAt) throw new Error("Reservation time range is invalid.");
  await prisma.reservation.create({ data: { branchId: branch.id, sectionId: table.sectionId, tableId: table.id, customerName: requiredText(input.customerName, "Customer name"), customerPhone: input.customerPhone?.trim().slice(0, 30) || null, partySize: capacity(input.partySize), startsAt: input.startsAt, endsAt: input.endsAt } });
  revalidatePath("/tables");
}

export async function recordTableOperation(input: { sourceTableId: string; targetTableId?: string; operation: TableOperationType; details?: string }) {
  const branch = await activeBranch();
  const sourceTableId = id(input.sourceTableId, "Source table");
  if (!Object.values(TableOperationType).includes(input.operation)) throw new Error("Invalid table operation.");
  const source = await prisma.diningTable.findFirst({ where: { id: sourceTableId, floor: { branchId: branch.id } }, select: { id: true } });
  if (!source) throw new Error("Source table not found.");
  let targetTableId: string | undefined;
  if (input.targetTableId) {
    targetTableId = id(input.targetTableId, "Target table");
    if (targetTableId === sourceTableId) throw new Error("Source and target tables must be different.");
    const target = await prisma.diningTable.findFirst({ where: { id: targetTableId, floor: { branchId: branch.id } }, select: { id: true } });
    if (!target) throw new Error("Target table not found in this branch.");
  }
  await prisma.tableOperation.create({ data: { branchId: branch.id, sourceTableId, targetTableId, operation: input.operation, details: input.details?.trim().slice(0, 500) || undefined } });
  revalidatePath("/tables");
}
