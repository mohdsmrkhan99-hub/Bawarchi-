import "dotenv/config";
import crypto from "node:crypto";
import pg from "pg";
import { MENU_ADD_ONS, MENU_DATA } from "./menu-data.mjs";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const id = () => crypto.randomUUID();

function required(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function money(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative price.`);
  return parsed.toFixed(2);
}

async function findOrCreateCategory(client, branchId, category, parentId = null, order = 0) {
  const name = required(category.name, "Category name");
  const existing = await client.query(
    `SELECT "id" FROM "MenuCategory"
     WHERE "branchId"=$1 AND "name"=$2 AND "parentId" IS NOT DISTINCT FROM $3
     ORDER BY "createdAt","id" LIMIT 1`,
    [branchId, name, parentId],
  );
  if (existing.rows[0]) {
    await client.query(`UPDATE "MenuCategory" SET "displayOrder"=$1,"updatedAt"=NOW() WHERE "id"=$2`, [category.displayOrder ?? order, existing.rows[0].id]);
    return existing.rows[0].id;
  }
  const result = await client.query(
    `INSERT INTO "MenuCategory" ("id","branchId","parentId","name","displayOrder","isActive","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW()) RETURNING "id"`,
    [id(), branchId, parentId, name, category.displayOrder ?? order],
  );
  return result.rows[0].id;
}

async function importItem(client, categoryId, item, order, addOnIds) {
  const itemResult = await client.query(
    `INSERT INTO "MenuItem" ("id","categoryId","name","description","displayOrder","isActive","isAvailable","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,true,$6,NOW(),NOW())
     ON CONFLICT ("categoryId","name") DO UPDATE SET "description"=EXCLUDED."description","displayOrder"=EXCLUDED."displayOrder","isAvailable"=EXCLUDED."isAvailable","updatedAt"=NOW()
     RETURNING "id"`,
    [id(), categoryId, required(item.name, "Item name"), item.description?.trim() || null, item.displayOrder ?? order, item.isAvailable !== false],
  );
  const itemId = itemResult.rows[0].id;
  for (const [variantOrder, variant] of (item.variants ?? []).entries()) {
    if (variant.price === null || variant.price === undefined || variant.price === "") continue;
    await client.query(
      `INSERT INTO "MenuVariant" ("id","itemId","name","price","displayOrder","isActive","isAvailable","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,true,$6,NOW(),NOW())
       ON CONFLICT ("itemId","name") DO UPDATE SET "price"=EXCLUDED."price","displayOrder"=EXCLUDED."displayOrder","isAvailable"=EXCLUDED."isAvailable","updatedAt"=NOW()`,
      [id(), itemId, required(variant.name, "Variant name"), money(variant.price, "Variant price"), variant.displayOrder ?? variantOrder, variant.isAvailable !== false],
    );
  }
  for (const addOnName of item.addOns ?? []) {
    const addOnId = addOnIds.get(required(addOnName, "Add-on name"));
    if (!addOnId) throw new Error(`Add-on "${addOnName}" is not defined in MENU_ADD_ONS.`);
    await client.query(
      `INSERT INTO "MenuItemAddOn" ("itemId","addOnId") VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [itemId, addOnId],
    );
  }
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  const branch = await client.query(`SELECT "id" FROM "Branch" WHERE "isActive"=true ORDER BY "createdAt" LIMIT 1`);
  if (!branch.rows[0]) throw new Error("No active branch is configured.");
  const branchId = branch.rows[0].id;

  const addOnIds = new Map();
  for (const [addOnOrder, addOn] of MENU_ADD_ONS.entries()) {
    const result = await client.query(
      `INSERT INTO "MenuAddOn" ("id","branchId","name","price","displayOrder","isActive","isAvailable","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,true,$6,NOW(),NOW())
       ON CONFLICT ("branchId","name") DO UPDATE SET "price"=EXCLUDED."price","displayOrder"=EXCLUDED."displayOrder","isAvailable"=EXCLUDED."isAvailable","updatedAt"=NOW()
       RETURNING "id"`,
      [id(), branchId, required(addOn.name, "Add-on name"), money(addOn.price, "Add-on price"), addOn.displayOrder ?? addOnOrder, addOn.isAvailable !== false],
    );
    addOnIds.set(addOn.name.trim(), result.rows[0].id);
  }

  for (const [categoryOrder, category] of MENU_DATA.entries()) {
    const categoryId = await findOrCreateCategory(client, branchId, category, null, categoryOrder);
    for (const [itemOrder, item] of (category.items ?? []).entries()) await importItem(client, categoryId, item, itemOrder, addOnIds);
    for (const [subcategoryOrder, subcategory] of (category.subcategories ?? []).entries()) {
      const subcategoryId = await findOrCreateCategory(client, branchId, subcategory, categoryId, subcategoryOrder);
      for (const [itemOrder, item] of (subcategory.items ?? []).entries()) await importItem(client, subcategoryId, item, itemOrder, addOnIds);
    }
  }
  await client.query(`DELETE FROM "MenuAddOn" WHERE "name" = 'Ghgghg' AND "price" = 1.00`);
  await client.query("COMMIT");
  console.log(`Imported ${MENU_DATA.length} menu categories. No menu records were invented.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
