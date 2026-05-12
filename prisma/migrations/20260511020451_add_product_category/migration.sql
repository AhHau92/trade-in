-- Step 1: Add categoryId as nullable first
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- Step 2: Fill categoryId from brand's first category
UPDATE "Product" p
SET "categoryId" = (
  SELECT cb."categoryId"
  FROM "CategoryBrand" cb
  WHERE cb."brandId" = p."brandId"
  LIMIT 1
);

-- Step 3: Make it required
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- Step 4: Add foreign key
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;