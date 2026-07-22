-- Dual-axis variant support (e.g. Storage + Colour).
-- Both columns are nullable so every existing product/variant stays
-- single-axis (today's behavior) until an admin opts in by setting
-- Product.variantLabel2.

ALTER TABLE "Product" ADD COLUMN "variantLabel2" TEXT;
ALTER TABLE "Variant" ADD COLUMN "axis2Value" TEXT;
