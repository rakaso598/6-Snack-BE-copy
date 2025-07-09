/*
  Warnings:

  - You are about to drop the column `totalExpense` on the `MonthlyBudget` table. All the data in the column will be lost.
  - You are about to drop the column `cartId` on the `OrderedItem` table. All the data in the column will be lost.
  - Added the required column `receiptId` to the `OrderedItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderedItem" DROP CONSTRAINT "OrderedItem_cartId_fkey";

-- AlterTable
ALTER TABLE "MonthlyBudget" DROP COLUMN "totalExpense",
ADD COLUMN     "currentMonthExpense" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderedItem" DROP COLUMN "cartId",
ADD COLUMN     "receiptId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderedItem" ADD CONSTRAINT "OrderedItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
