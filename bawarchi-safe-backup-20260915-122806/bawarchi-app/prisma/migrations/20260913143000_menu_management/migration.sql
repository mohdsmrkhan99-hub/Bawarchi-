CREATE TABLE "MenuCategory" (
 "id" TEXT NOT NULL, "branchId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
 "displayOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuItem" (
 "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
 "displayOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true, "isAvailable" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuVariant" (
 "id" TEXT NOT NULL, "itemId" TEXT NOT NULL, "name" TEXT NOT NULL, "price" DECIMAL(10,2) NOT NULL,
 "displayOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true, "isAvailable" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MenuVariant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuAddOn" (
 "id" TEXT NOT NULL, "branchId" TEXT NOT NULL, "name" TEXT NOT NULL, "price" DECIMAL(10,2) NOT NULL,
 "displayOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true, "isAvailable" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MenuAddOn_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MenuItemAddOn" ("itemId" TEXT NOT NULL, "addOnId" TEXT NOT NULL, CONSTRAINT "MenuItemAddOn_pkey" PRIMARY KEY ("itemId","addOnId"));
CREATE UNIQUE INDEX "MenuCategory_branchId_name_key" ON "MenuCategory"("branchId","name");
CREATE UNIQUE INDEX "MenuItem_categoryId_name_key" ON "MenuItem"("categoryId","name");
CREATE UNIQUE INDEX "MenuVariant_itemId_name_key" ON "MenuVariant"("itemId","name");
CREATE UNIQUE INDEX "MenuAddOn_branchId_name_key" ON "MenuAddOn"("branchId","name");
CREATE INDEX "MenuCategory_branchId_displayOrder_idx" ON "MenuCategory"("branchId","displayOrder");
CREATE INDEX "MenuItem_categoryId_displayOrder_idx" ON "MenuItem"("categoryId","displayOrder");
CREATE INDEX "MenuItem_isActive_isAvailable_idx" ON "MenuItem"("isActive","isAvailable");
CREATE INDEX "MenuVariant_itemId_displayOrder_idx" ON "MenuVariant"("itemId","displayOrder");
CREATE INDEX "MenuAddOn_branchId_displayOrder_idx" ON "MenuAddOn"("branchId","displayOrder");
CREATE INDEX "MenuItemAddOn_addOnId_idx" ON "MenuItemAddOn"("addOnId");
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuVariant" ADD CONSTRAINT "MenuVariant_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuAddOn" ADD CONSTRAINT "MenuAddOn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItemAddOn" ADD CONSTRAINT "MenuItemAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "MenuAddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
