/*
  Warnings:

  - You are about to drop the `OrderedItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `orderId` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderedItem" DROP CONSTRAINT "OrderedItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderedItem" DROP CONSTRAINT "OrderedItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderedItem" DROP CONSTRAINT "OrderedItem_receiptId_fkey";

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "orderId" INTEGER NOT NULL,
ADD COLUMN     "productId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "OrderedItem";

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
