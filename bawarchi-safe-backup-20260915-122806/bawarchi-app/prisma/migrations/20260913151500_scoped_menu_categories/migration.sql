DROP INDEX "MenuCategory_branchId_name_key";
CREATE UNIQUE INDEX "MenuCategory_branchId_parentId_name_key" ON "MenuCategory"("branchId", "parentId", "name");
