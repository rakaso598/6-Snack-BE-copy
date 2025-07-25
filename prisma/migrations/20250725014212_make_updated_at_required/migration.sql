/*
  Warnings:

  - Made the column `updatedAt` on table `CartItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "updatedAt" SET NOT NULL;
