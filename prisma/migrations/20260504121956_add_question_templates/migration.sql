/*
  Warnings:

  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_variantId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionOption" DROP CONSTRAINT "QuestionOption_questionId_fkey";

-- DropTable
DROP TABLE "Question";

-- DropTable
DROP TABLE "QuestionOption";

-- CreateTable
CREATE TABLE "QuestionTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTemplateOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceAdjust" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "QuestionTemplateOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantQuestion" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "variantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "VariantQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariantQuestion_variantId_templateId_key" ON "VariantQuestion"("variantId", "templateId");

-- AddForeignKey
ALTER TABLE "QuestionTemplateOption" ADD CONSTRAINT "QuestionTemplateOption_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantQuestion" ADD CONSTRAINT "VariantQuestion_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantQuestion" ADD CONSTRAINT "VariantQuestion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
