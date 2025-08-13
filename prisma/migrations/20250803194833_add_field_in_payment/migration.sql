/*
  Warnings:

  - Added the required column `orderName` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suppliedAmount` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vat` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "approvedAt" TEXT,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "orderName" TEXT NOT NULL,
ADD COLUMN     "requestedAt" TEXT NOT NULL,
ADD COLUMN     "suppliedAmount" INTEGER NOT NULL,
ADD COLUMN     "totalAmount" INTEGER NOT NULL,
ADD COLUMN     "vat" INTEGER NOT NULL;
