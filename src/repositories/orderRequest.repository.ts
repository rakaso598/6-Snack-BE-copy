import { PrismaClient, Prisma } from '@prisma/client';
import type { TCreateOrderRequest, TCreateOrderResponse } from '../types/orderRequest.types';

const prisma = new PrismaClient();

const createOrder = async (orderData: TCreateOrderRequest, tx?: Prisma.TransactionClient): Promise<TCreateOrderResponse> => {
  const client = tx || prisma;

  // 1. 카트 아이템들을 가져와서 receipt 생성
  const cartItems = await client.cartItem.findMany({
    where: {
      id: { in: orderData.cartItemIds }
    },
    include: {
      product: true
    }
  });

  if (cartItems.length !== orderData.cartItemIds.length) {
    throw new Error('일부 카트 아이템을 찾을 수 없습니다.');
  }

  // 2. 각 카트 아이템으로부터 receipt 생성
  const receipts = await Promise.all(
    cartItems.map(async (cartItem) => {
      return await client.receipt.create({
        data: {
          productName: cartItem.product.name,
          price: cartItem.product.price,
          imageUrl: cartItem.product.imageUrl,
          quantity: cartItem.quantity
        }
      });
    })
  );

  // 3. 총 가격 계산
  const totalPrice = receipts.reduce((sum, receipt) => {
    return sum + (receipt.price * receipt.quantity);
  }, 0);

  // 4. 주문 생성
  const order = await client.order.create({
    data: {
      userId: orderData.userId,
      adminMessage: orderData.adminMessage,
      requestMessage: orderData.requestMessage,
      totalPrice: totalPrice,
      status: 'PENDING'
    }
  });

  // 5. OrderedItem 생성 (주문과 receipt 연결)
  await Promise.all(
    receipts.map(async (receipt) => {
      return await client.orderedItem.create({
        data: {
          orderId: order.id,
          receiptId: receipt.id
        }
      });
    })
  );

  // 6. 생성된 주문 정보 반환
  const result = await client.order.findUnique({
    where: { id: order.id },
    include: {
      orderedItems: {
        include: {
          receipt: {
            select: {
              id: true,
              productName: true,
              price: true,
              imageUrl: true,
              quantity: true
            }
          }
        }
      }
    }
  });

  return result as TCreateOrderResponse;
};

const getOrderById = async (orderId: number, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  return await client.order.findUnique({
    where: { id: orderId },
    include: {
      orderedItems: {
        include: {
          receipt: {
            select: {
              id: true,
              productName: true,
              price: true,
              imageUrl: true,
              quantity: true
            }
          }
        }
      }
    }
  });
};

const getOrdersByUserId = async (userId: string, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  return await client.order.findMany({
    where: { userId },
    include: {
      orderedItems: {
        include: {
          receipt: {
            select: {
              id: true,
              productName: true,
              price: true,
              imageUrl: true,
              quantity: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const updateOrderStatus = async (orderId: number, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED', tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  return await client.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      orderedItems: {
        include: {
          receipt: {
            select: {
              id: true,
              productName: true,
              price: true,
              imageUrl: true,
              quantity: true
            }
          }
        }
      }
    }
  });
};

export default {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus
}; 