-- Per-variant option subset (e.g. a variant that only offers 5 of a
-- template's 200 colour options).

-- Marker on the junction row:
--   false (default) = legacy/unconfigured -> storefront shows ALL of the
--                      template's options (today's behavior, unaffected)
--   true             = admin picked a subset -> storefront shows only the
--                      rows in VariantQuestionOption for this VariantQuestion
ALTER TABLE "VariantQuestion" ADD COLUMN "optionsConfigured" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "VariantQuestionOption" (
    "id" TEXT NOT NULL,
    "variantQuestionId" TEXT NOT NULL,
    "templateOptionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VariantQuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VariantQuestionOption_variantQuestionId_templateOptionId_key" ON "VariantQuestionOption"("variantQuestionId", "templateOptionId");

ALTER TABLE "VariantQuestionOption" ADD CONSTRAINT "VariantQuestionOption_variantQuestionId_fkey" FOREIGN KEY ("variantQuestionId") REFERENCES "VariantQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VariantQuestionOption" ADD CONSTRAINT "VariantQuestionOption_templateOptionId_fkey" FOREIGN KEY ("templateOptionId") REFERENCES "QuestionTemplateOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
