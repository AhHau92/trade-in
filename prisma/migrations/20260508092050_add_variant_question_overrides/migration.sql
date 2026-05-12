-- CreateTable
CREATE TABLE "VariantQuestionOverride" (
    "id" TEXT NOT NULL,
    "variantQuestionId" TEXT NOT NULL,
    "templateOptionId" TEXT NOT NULL,
    "priceAdjust" DOUBLE PRECISION NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isWhatsapp" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VariantQuestionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariantQuestionOverride_variantQuestionId_templateOptionId_key" ON "VariantQuestionOverride"("variantQuestionId", "templateOptionId");

-- AddForeignKey
ALTER TABLE "VariantQuestionOverride" ADD CONSTRAINT "VariantQuestionOverride_variantQuestionId_fkey" FOREIGN KEY ("variantQuestionId") REFERENCES "VariantQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantQuestionOverride" ADD CONSTRAINT "VariantQuestionOverride_templateOptionId_fkey" FOREIGN KEY ("templateOptionId") REFERENCES "QuestionTemplateOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
