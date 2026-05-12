/*
  Warnings:

  - A unique constraint covering the columns `[slug,condition]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Product_slug_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "condition" TEXT NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_condition_key" ON "Product"("slug", "condition");
