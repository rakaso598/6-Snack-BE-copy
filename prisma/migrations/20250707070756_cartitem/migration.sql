/*
  Warnings:

  - You are about to drop the column `price` on the `OrderedItem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `OrderedItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `OrderedItem` table. All the data in the column will be lost.
  - Added the required column `cartId` to the `OrderedItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderedItem" DROP CONSTRAINT "OrderedItem_productId_fkey";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "isChecked" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "OrderedItem" DROP COLUMN "price",
DROP COLUMN "productId",
DROP COLUMN "quantity",
ADD COLUMN     "cartId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderedItem" ADD CONSTRAINT "OrderedItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "CartItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
