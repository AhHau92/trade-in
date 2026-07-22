-- Product: rich content for the single product page.
-- All nullable so existing rows are unaffected; storefront/admin code falls
-- back to name-derived defaults when these are blank.
ALTER TABLE "Product" ADD COLUMN "introContent" TEXT;
ALTER TABLE "Product" ADD COLUMN "seoContent" TEXT;
ALTER TABLE "Product" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN "metaDescription" TEXT;

-- Booking: branch name snapshot, same pattern as the existing
-- productName/variantName snapshot columns — freezes the branch's name at
-- booking time so a later rename/deletion doesn't rewrite booking history.
ALTER TABLE "Booking" ADD COLUMN "branchName" TEXT;
