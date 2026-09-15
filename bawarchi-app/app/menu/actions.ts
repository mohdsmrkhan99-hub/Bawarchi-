"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { serializeData, serializeMoney } from "@/lib/serializers";

const text = (value: unknown, label: string, max = 120) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`${label} is required and must be ${max} characters or fewer.`);
  return value.trim();
};
const identifier = (value: unknown, label: string) => text(value, label, 64);
const price = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 1000000) throw new Error("Price must be greater than zero.");
  return n.toFixed(2);
};
const booleanValue = (value: unknown, label: string) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${label} must be true or false.`);
};
const variants = (value: unknown) => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 30) throw new Error("Variants are invalid.");
  return value.map((variant, index) => {
    if (!variant || typeof variant !== "object") throw new Error(`Variant ${index + 1} is invalid.`);
    const record = variant as Record<string, unknown>;
    return { name: text(record.name, `Variant ${index + 1} name`, 64), price: price(record.price), displayOrder: index };
  });
};
async function branch() {
  const value = await prisma.branch.findFirst({ where: { isActive: true, restaurant: { isActive: true } }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } });
  if (!value) throw new Error("No active branch is configured.");
  return value;
}
export async function getMenuManagementData() {
  const b = await branch();
  const [categories, addOns] = await Promise.all([
    prisma.menuCategory.findMany({ where: { branchId: b.id }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { items: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { variants: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }, addOns: { include: { addOn: true } } } } } }),
    prisma.menuAddOn.findMany({ where: { branchId: b.id }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
  ]);
  return serializeData({ branch: b, categories: categories.map(c => ({ ...c, items: c.items.map(i => ({ ...i, variants: i.variants.map(v => ({ ...v, price: serializeMoney(v.price) })), addOns: i.addOns.map(a => a.addOnId) })) })), addOns: addOns.map(a => ({ ...a, price: serializeMoney(a.price) })) });
}
export async function menuMutation(action: string, input: Record<string, unknown>) {
  const b = await branch();
  const id = (key: string) => identifier(input[key], key);
  if (action === "create-category") {
    const max = await prisma.menuCategory.aggregate({ where: { branchId: b.id }, _max: { displayOrder: true } });
    await prisma.menuCategory.create({ data: { branchId: b.id, name: text(input.name, "Category name"), description: typeof input.description === "string" ? input.description.trim().slice(0, 300) || null : null, displayOrder: (max._max.displayOrder ?? -1) + 1 } });
  } else if (action === "update-category") await prisma.menuCategory.updateMany({ where: { id: id("categoryId"), branchId: b.id }, data: { name: text(input.name, "Category name"), description: typeof input.description === "string" ? input.description.trim().slice(0, 300) || null : null } });
  else if (action === "create-item") {
    const categoryId = id("categoryId"); const category = await prisma.menuCategory.findFirst({ where: { id: categoryId, branchId: b.id } }); if (!category) throw new Error("Category not found.");
    const max = await prisma.menuItem.aggregate({ where: { categoryId }, _max: { displayOrder: true } });
    const itemVariants = variants(input.variants);
    if (!itemVariants.length) throw new Error("Add at least one priced variant.");
    await prisma.menuItem.create({ data: { categoryId, name: text(input.name, "Item name"), description: typeof input.description === "string" ? input.description.trim().slice(0, 500) || null : null, imageUrl: typeof input.imageUrl === "string" ? input.imageUrl.trim().slice(0, 500) || null : null, isVegetarian: booleanValue(input.isVegetarian ?? false, "Vegetarian flag"), isAvailable: booleanValue(input.isAvailable ?? true, "Availability"), isActive: booleanValue(input.isActive ?? true, "Active flag"), displayOrder: Number.isInteger(input.displayOrder) ? Number(input.displayOrder) : (max._max.displayOrder ?? -1) + 1, variants: { create: itemVariants } } });
  } else if (action === "update-item") {
    const item = await prisma.menuItem.findFirst({ where: { id: id("itemId"), category: { branchId: b.id } } }); if (!item) throw new Error("Item not found.");
    await prisma.menuItem.update({ where: { id: item.id }, data: { name: text(input.name, "Item name"), description: typeof input.description === "string" ? input.description.trim().slice(0, 500) || null : null, imageUrl: typeof input.imageUrl === "string" ? input.imageUrl.trim().slice(0, 500) || null : null, isVegetarian: input.isVegetarian === undefined ? undefined : booleanValue(input.isVegetarian, "Vegetarian flag"), isAvailable: input.isAvailable === undefined ? undefined : booleanValue(input.isAvailable, "Availability"), isActive: input.isActive === undefined ? undefined : booleanValue(input.isActive, "Active flag"), displayOrder: Number.isInteger(input.displayOrder) ? Number(input.displayOrder) : undefined } });
  } else if (action === "create-variant") {
    const itemId = id("itemId"); const item = await prisma.menuItem.findFirst({ where: { id: itemId, category: { branchId: b.id } } }); if (!item) throw new Error("Item not found.");
    const max = await prisma.menuVariant.aggregate({ where: { itemId }, _max: { displayOrder: true } });
    await prisma.menuVariant.create({ data: { itemId, name: text(input.name, "Variant name"), price: price(input.price), displayOrder: (max._max.displayOrder ?? -1) + 1 } });
  } else if (action === "update-variant") {
    const variant = await prisma.menuVariant.findFirst({ where: { id: id("variantId"), item: { category: { branchId: b.id } } } }); if (!variant) throw new Error("Variant not found.");
    await prisma.menuVariant.update({ where: { id: variant.id }, data: { name: text(input.name, "Variant name"), price: price(input.price) } });
  } else if (action === "create-addon") {
    const max = await prisma.menuAddOn.aggregate({ where: { branchId: b.id }, _max: { displayOrder: true } });
    await prisma.menuAddOn.create({ data: { branchId: b.id, name: text(input.name, "Add-on name"), price: price(input.price), displayOrder: (max._max.displayOrder ?? -1) + 1 } });
  } else if (action === "update-addon") await prisma.menuAddOn.updateMany({ where: { id: id("addOnId"), branchId: b.id }, data: { name: text(input.name, "Add-on name"), price: price(input.price) } });
  else if (action === "toggle") {
    const entity = text(input.entity, "Entity"); const entityId = id("entityId"); const field = input.field === "isActive" ? "isActive" : input.field === "isAvailable" ? "isAvailable" : null; if (!field) throw new Error("Invalid toggle.");
    const value = booleanValue(input.value, "Toggle value");
    if (entity === "category") await prisma.menuCategory.updateMany({ where: { id: entityId, branchId: b.id }, data: { [field]: value } });
    else if (entity === "item") await prisma.menuItem.updateMany({ where: { id: entityId, category: { branchId: b.id } }, data: { [field]: value } });
    else if (entity === "variant") await prisma.menuVariant.updateMany({ where: { id: entityId, item: { category: { branchId: b.id } } }, data: { [field]: value } });
    else if (entity === "addon") await prisma.menuAddOn.updateMany({ where: { id: entityId, branchId: b.id }, data: { [field]: value } });
  } else if (action === "link-addon") {
    const itemId = id("itemId"), addOnId = id("addOnId"); const valid = await prisma.menuItem.findFirst({ where: { id: itemId, category: { branchId: b.id } } }) && await prisma.menuAddOn.findFirst({ where: { id: addOnId, branchId: b.id } }); if (!valid) throw new Error("Menu record not found.");
    if (Boolean(input.value)) await prisma.menuItemAddOn.upsert({ where: { itemId_addOnId: { itemId, addOnId } }, create: { itemId, addOnId }, update: {} }); else await prisma.menuItemAddOn.deleteMany({ where: { itemId, addOnId } });
  } else if (action === "delete") {
    const entity = text(input.entity, "Entity"); const entityId = id("entityId");
    if (entity === "category") {
      const row = await prisma.menuCategory.findFirst({ where: { id: entityId, branchId: b.id }, include: { _count: { select: { items: true } } } });
      if (!row) throw new Error("Category not found."); if (row._count.items) throw new Error("Category contains items. Hide it instead or delete its items first.");
      await prisma.menuCategory.delete({ where: { id: entityId } });
    } else if (entity === "item") {
      const row = await prisma.menuItem.findFirst({ where: { id: entityId, category: { branchId: b.id } }, include: { _count: { select: { variants: true, addOns: true } } } });
      if (!row) throw new Error("Item not found.");
      await prisma.menuItem.update({ where: { id: entityId }, data: { isActive: false, isAvailable: false } });
      await prisma.menuVariant.updateMany({ where: { itemId: entityId }, data: { isActive: false, isAvailable: false } });
    }
    else if (entity === "variant") {
      const row = await prisma.menuVariant.findFirst({ where: { id: entityId, item: { category: { branchId: b.id } } } });
      if (!row) throw new Error("Variant not found.");
      await prisma.menuVariant.update({ where: { id: entityId }, data: { isActive: false, isAvailable: false } });
    } else if (entity === "addon") {
      const row = await prisma.menuAddOn.findFirst({ where: { id: entityId, branchId: b.id }, include: { _count: { select: { items: true } } } });
      if (!row) throw new Error("Add-on not found.");
      if (row._count.items) throw new Error("Add-on is associated with menu items. Remove those associations first or deactivate the add-on instead.");
      await prisma.menuAddOn.delete({ where: { id: entityId } });
    }
    else throw new Error("Invalid entity.");
  } else if (action === "reorder") {
    const entity = text(input.entity, "Entity"); const entityId = id("entityId"); const direction = input.direction;
    if (direction !== "up" && direction !== "down") throw new Error("Invalid direction.");
    if (entity === "category") {
      const rows = await prisma.menuCategory.findMany({ where: { branchId: b.id, isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, displayOrder: true } });
      await swapOrder(rows, entityId, direction, (a, value) => prisma.menuCategory.update({ where: { id: a }, data: { displayOrder: value } }));
    } else if (entity === "item") {
      const row = await prisma.menuItem.findFirst({ where: { id: entityId, category: { branchId: b.id } } }); if (!row) throw new Error("Item not found.");
      const rows = await prisma.menuItem.findMany({ where: { categoryId: row.categoryId, isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, displayOrder: true } });
      await swapOrder(rows, entityId, direction, (a, value) => prisma.menuItem.update({ where: { id: a }, data: { displayOrder: value } }));
    } else if (entity === "variant") {
      const row = await prisma.menuVariant.findFirst({ where: { id: entityId, item: { category: { branchId: b.id } } } }); if (!row) throw new Error("Variant not found.");
      const rows = await prisma.menuVariant.findMany({ where: { itemId: row.itemId, isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, displayOrder: true } });
      await swapOrder(rows, entityId, direction, (a, value) => prisma.menuVariant.update({ where: { id: a }, data: { displayOrder: value } }));
    } else if (entity === "addon") {
      const rows = await prisma.menuAddOn.findMany({ where: { branchId: b.id, isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, displayOrder: true } });
      await swapOrder(rows, entityId, direction, (a, value) => prisma.menuAddOn.update({ where: { id: a }, data: { displayOrder: value } }));
    } else throw new Error("Invalid entity.");
  } else throw new Error("Unsupported menu action.");
  revalidatePath("/menu");
  return { ok: true };
}

async function swapOrder(rows: { id: string; displayOrder: number }[], id: string, direction: "up" | "down", update: (id: string, value: number) => Promise<unknown>) {
  const index = rows.findIndex(row => row.id === id); const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || !rows[target]) return;
  await Promise.all([update(rows[index].id, rows[target].displayOrder), update(rows[target].id, rows[index].displayOrder)]);
}
