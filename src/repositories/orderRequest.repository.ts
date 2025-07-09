import { Prisma } from '@prisma/client';
import type { TCreateOrderRequest, TCreateOrderResponse } from '../types/orderRequest.types';
import prisma from "../config/prisma";

const createOrder = async (orderData: TCreateOrderRequest, tx?: Prisma.TransactionClient): Promise<TCreateOrderResponse> => {
  const client = tx || prisma;

  const { cartItemIds, ...orderInfo } = orderData;

  // 주문 생성
  const order = await client.order.create({
    data: {
      ...orderInfo,
      status: orderInfo.status || 'PENDING',
      orderedItems: {
        create: cartItemIds.map(cartItemId => ({
          cartId: cartItemId
        }))
      }
    },
    include: {
      orderedItems: {
        include: {
          cartItem: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true
                }
              }
            }
          }
        }
      }
    }
  });

  return order as TCreateOrderResponse;
};

const getOrderById = async (orderId: number, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  return await client.order.findUnique({
    where: { id: orderId },
    include: {
      orderedItems: {
        include: {
          cartItem: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true
                }
              }
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
          cartItem: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true
                }
              }
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
          cartItem: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true
                }
              }
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