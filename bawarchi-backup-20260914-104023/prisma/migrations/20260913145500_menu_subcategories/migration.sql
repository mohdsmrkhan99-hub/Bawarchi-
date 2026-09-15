ALTER TABLE "MenuCategory" ADD COLUMN "parentId" TEXT;
CREATE INDEX "MenuCategory_parentId_displayOrder_idx" ON "MenuCategory"("parentId", "displayOrder");
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
