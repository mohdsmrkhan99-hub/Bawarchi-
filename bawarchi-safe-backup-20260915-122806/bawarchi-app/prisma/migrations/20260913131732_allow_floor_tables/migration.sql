/*
  Warnings:

  - Added the required column `floorId` to the `DiningTable` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DiningTable_sectionId_tableNumber_key";

-- AlterTable
ALTER TABLE "DiningTable" ADD COLUMN     "floorId" TEXT;
UPDATE "DiningTable" AS t SET "floorId" = s."floorId" FROM "Section" AS s WHERE t."sectionId" = s."id";
ALTER TABLE "DiningTable" ALTER COLUMN "floorId" SET NOT NULL,
ALTER COLUMN "sectionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "sectionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "DiningTable_floorId_tableNumber_idx" ON "DiningTable"("floorId", "tableNumber");
CREATE UNIQUE INDEX "DiningTable_section_tableNumber_unique" ON "DiningTable"("sectionId", "tableNumber") WHERE "sectionId" IS NOT NULL;
CREATE UNIQUE INDEX "DiningTable_floor_tableNumber_unique" ON "DiningTable"("floorId", "tableNumber") WHERE "sectionId" IS NULL;

-- AddForeignKey
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
