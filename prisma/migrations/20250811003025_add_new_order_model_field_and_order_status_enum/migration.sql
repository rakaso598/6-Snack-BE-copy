/*
  Warnings:

  - You are about to drop the column `totalPrice` on the `Order` table. All the data in the column will be lost.
  - Added the required column `deliveryFee` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productsPriceTotal` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'INSTANT_APPROVED';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "totalPrice",
ADD COLUMN     "deliveryFee" INTEGER NOT NULL,
ADD COLUMN     "productsPriceTotal" INTEGER NOT NULL;
