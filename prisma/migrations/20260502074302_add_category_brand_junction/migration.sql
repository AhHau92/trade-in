/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Brand` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_categoryId_fkey";

-- AlterTable
ALTER TABLE "Brand" DROP COLUMN "categoryId";

-- CreateTable
CREATE TABLE "CategoryBrand" (
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "CategoryBrand_pkey" PRIMARY KEY ("categoryId","brandId")
);

-- AddForeignKey
ALTER TABLE "CategoryBrand" ADD CONSTRAINT "CategoryBrand_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBrand" ADD CONSTRAINT "CategoryBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
