import "dotenv/config";
import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const id = () => crypto.randomUUID();

try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const restaurantResult = await client.query(
      `INSERT INTO "Restaurant" ("id", "name", "code", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())
       ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "isActive" = true, "updatedAt" = NOW()
       RETURNING "id"`,
      [id(), "New Bawarchi Family Restaurant", "BAWARCHI-DEMO"],
    );
    const restaurantId = restaurantResult.rows[0].id;

    const branchResult = await client.query(
      `INSERT INTO "Branch" ("id", "restaurantId", "name", "code", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       ON CONFLICT ("restaurantId", "code") DO UPDATE SET "name" = EXCLUDED."name", "isActive" = true, "updatedAt" = NOW()
       RETURNING "id"`,
      [id(), restaurantId, "Main Branch", "MAIN"],
    );
    const branchId = branchResult.rows[0].id;

    const sections = [
      { name: "Ground Floor", order: 0 },
      { name: "First Floor", order: 1 },
      { name: "Second Floor", order: 2 },
    ];

    for (const section of sections) {
      const existingFloor = await client.query(
        `SELECT "id" FROM "Floor" WHERE "branchId" = $1 AND "name" = $2 LIMIT 1`,
        [branchId, section.name],
      );
      const floorId = existingFloor.rows[0]?.id ?? (
        await client.query(
          `INSERT INTO "Floor" ("id","branchId","name","displayOrder","isActive","createdAt","updatedAt")
           VALUES ($1,$2,$3,$4,true,NOW(),NOW()) RETURNING "id"`,
          [id(), branchId, section.name, section.order],
        )
      ).rows[0].id;
      await client.query(`UPDATE "Floor" SET "displayOrder"=$1,"isActive"=true,"updatedAt"=NOW() WHERE "id"=$2`, [section.order, floorId]);
      const existingSection = await client.query(
        `SELECT "id" FROM "Section" WHERE "floorId" = $1 AND "name" = $2 LIMIT 1`,
        [floorId, "Main Section"],
      );
      const sectionId =
        existingSection.rows[0]?.id ??
        (
          await client.query(
            `INSERT INTO "Section" ("id", "branchId", "floorId", "name", "displayOrder", "isActive", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
             RETURNING "id"`,
            [id(), branchId, floorId, "Main Section", section.order],
          )
        ).rows[0].id;
      await client.query(
        `UPDATE "Section" SET "floorId" = $1, "displayOrder" = $2, "isActive" = true, "updatedAt" = NOW() WHERE "id" = $3`,
        [floorId, section.order, sectionId],
      );

      for (const [index, tableNumber] of ["1", "2", "3"].entries()) {
        await client.query(
          `INSERT INTO "DiningTable" ("id", "floorId", "sectionId", "tableNumber", "capacity", "status", "displayOrder", "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, 4, 'AVAILABLE', $5, true, NOW(), NOW())
           ON CONFLICT ("sectionId", "tableNumber") DO UPDATE SET "isActive" = true`,
          [id(), floorId, sectionId, tableNumber, index],
        );
      }
    }

    await client.query("COMMIT");
    console.log("Seeded Main Branch with Ground, First, and Second Floor tables.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
