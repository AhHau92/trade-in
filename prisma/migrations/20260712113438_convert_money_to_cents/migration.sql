-- Convert money fields from Float dollars to Int cents.
--
-- Prisma's auto-generated migration for this schema change was DROP COLUMN +
-- ADD COLUMN (it can't detect "rename + retype" as one operation), which
-- would have silently wiped every existing price. This hand-written version
-- instead renames each column in place and converts its existing values,
-- multiplying by 100 and rounding to the nearest cent (guards against
-- leftover float artifacts, e.g. a stored 4.989999999999998 becoming 499
-- cents instead of a wrong 498).

-- Booking.finalPrice -> finalPriceCents
ALTER TABLE "Booking" RENAME COLUMN "finalPrice" TO "finalPriceCents";
ALTER TABLE "Booking" ALTER COLUMN "finalPriceCents" TYPE INTEGER USING ROUND("finalPriceCents" * 100)::INTEGER;

-- QuestionTemplateOption.priceAdjust -> priceAdjustCents
ALTER TABLE "QuestionTemplateOption" RENAME COLUMN "priceAdjust" TO "priceAdjustCents";
ALTER TABLE "QuestionTemplateOption" ALTER COLUMN "priceAdjustCents" TYPE INTEGER USING ROUND("priceAdjustCents" * 100)::INTEGER;
ALTER TABLE "QuestionTemplateOption" ALTER COLUMN "priceAdjustCents" SET DEFAULT 0;

-- Settings.pickupFee -> pickupFeeCents
ALTER TABLE "Settings" RENAME COLUMN "pickupFee" TO "pickupFeeCents";
ALTER TABLE "Settings" ALTER COLUMN "pickupFeeCents" TYPE INTEGER USING ROUND("pickupFeeCents" * 100)::INTEGER;
ALTER TABLE "Settings" ALTER COLUMN "pickupFeeCents" SET DEFAULT 0;

-- Variant.basePrice -> basePriceCents
ALTER TABLE "Variant" RENAME COLUMN "basePrice" TO "basePriceCents";
ALTER TABLE "Variant" ALTER COLUMN "basePriceCents" TYPE INTEGER USING ROUND("basePriceCents" * 100)::INTEGER;

-- VariantQuestionOverride.priceAdjust -> priceAdjustCents
ALTER TABLE "VariantQuestionOverride" RENAME COLUMN "priceAdjust" TO "priceAdjustCents";
ALTER TABLE "VariantQuestionOverride" ALTER COLUMN "priceAdjustCents" TYPE INTEGER USING ROUND("priceAdjustCents" * 100)::INTEGER;
